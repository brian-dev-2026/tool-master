param(
  [Parameter(Mandatory = $true)][ValidateSet('word', 'excel', 'powerpoint')][string]$App,
  [Parameter(Mandatory = $true)][string]$In,
  [Parameter(Mandatory = $true)][string]$Out,
  [Parameter(Mandatory = $true)][ValidateSet('pdf', 'docx')][string]$Target
)

$ErrorActionPreference = 'Stop'
# A wrong password makes protected files fail fast instead of opening a hidden prompt.
$DummyPassword = 'tm-wrong-pw'
$processName = @{ word = 'WINWORD'; excel = 'EXCEL'; powerpoint = 'POWERPNT' }[$App]
$progId = @{ word = 'Word.Application'; excel = 'Excel.Application'; powerpoint = 'PowerPoint.Application' }[$App]

$before = @(Get-Process -Name $processName -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$office = New-Object -ComObject $progId
$started = @(Get-Process -Name $processName -ErrorAction SilentlyContinue | Where-Object { $before -notcontains $_.Id })
if ($started.Count -gt 0) { [Console]::Out.WriteLine("PID:$($started[0].Id)"); [Console]::Out.Flush() }

$doc = $null
try {
  switch ($App) {
    'word' {
      $office.Visible = $false
      $office.DisplayAlerts = 0
      # Open(FileName, ConfirmConversions, ReadOnly, AddToRecentFiles, PasswordDocument)
      $doc = $office.Documents.Open($In, $false, $true, $false, $DummyPassword)
      $format = if ($Target -eq 'pdf') { 17 } else { 16 }
      $doc.SaveAs2($Out, $format)
    }
    'excel' {
      $office.Visible = $false
      $office.DisplayAlerts = $false
      # Open(FileName, UpdateLinks, ReadOnly, Format, Password)
      $doc = $office.Workbooks.Open($In, 0, $true, 5, $DummyPassword)
      $doc.ExportAsFixedFormat(0, $Out)
    }
    'powerpoint' {
      $office.DisplayAlerts = 1
      # Open(FileName, ReadOnly, Untitled, WithWindow); "file::password" fails fast on protected decks.
      $doc = $office.Presentations.Open("$($In)::$DummyPassword", -1, 0, 0)
      $doc.SaveAs($Out, 32)
    }
  }
}
catch {
  [Console]::Error.WriteLine($_.Exception.Message)
  exit 1
}
finally {
  if ($doc) {
    try { if ($App -eq 'powerpoint') { $doc.Close() } else { $doc.Close($false) } } catch {}
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($doc)
  }
  try { $office.Quit() } catch {}
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($office)
}
exit 0
