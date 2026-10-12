# One-off: builds test/fixtures/encrypted.pdf (user password "secret") from sample.pdf.
from pathlib import Path
from pypdf import PdfReader, PdfWriter

fixtures = Path(__file__).resolve().parent.parent / "test" / "fixtures"
writer = PdfWriter(clone_from=PdfReader(fixtures / "sample.pdf"))
writer.encrypt(user_password="secret", owner_password="secret-owner", algorithm="RC4-128")
with open(fixtures / "encrypted.pdf", "wb") as f:
    writer.write(f)
print("encrypted.pdf written")
