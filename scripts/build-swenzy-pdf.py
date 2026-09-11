from pathlib import Path
import os
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image
from pypdf import PdfReader
import pypdfium2 as pdfium
import json
root = Path(__file__).resolve().parents[1]
out = root / "customers/swenzy-logistics/delivery"
out.mkdir(parents=True, exist_ok=True)
pdf_path = Path(os.environ.get("SWENZY_PDF_OUT", out / "swenzy-logistics-website.pdf"))
pages = ["home", "services", "about", "contact", "privacy"]
pdf = canvas.Canvas(str(pdf_path))
pdf.setTitle("Swenzy Logistics - Website Review Proof")
pdf.setAuthor("Red Spectrum")
for index, page in enumerate(pages, 1):
    source = root / f"customers/swenzy-logistics/qa/pdf-{page}.png"
    with Image.open(source) as image:
        width, height = image.size
    scale = 0.75
    page_width, page_height = width * scale, height * scale + 38
    pdf.setPageSize((page_width, page_height))
    pdf.setFillColorRGB(0.04, 0.11, 0.19)
    pdf.rect(0, page_height - 38, page_width, 38, fill=1, stroke=0)
    pdf.setFillColorRGB(1,1,1)
    pdf.setFont("Helvetica", 10)
    pdf.drawString(20, page_height - 24, f"SWENZY LOGISTICS  /  {page.upper()}  /  CUSTOMER REVIEW")
    pdf.drawRightString(page_width - 20, page_height - 24, f"{index} / 5")
    pdf.drawImage(ImageReader(str(source)), 0, 0, width=width*scale, height=height*scale)
    pdf.bookmarkPage(page)
    pdf.addOutlineEntry(page.title(), page)
    pdf.showPage()
pdf.save()
reader = PdfReader(str(pdf_path))
assert len(reader.pages) == 5
renders = root / "customers/swenzy-logistics/qa/pdf-rendered"
renders.mkdir(exist_ok=True)
document = pdfium.PdfDocument(str(pdf_path))
for index, page in enumerate(document):
    bitmap = page.render(scale=1)
    bitmap.to_pil().save(renders / f"page-{index+1}.png")
    bitmap.close()
    page.close()
document.close()
print(json.dumps({"pdf":str(pdf_path),"pages":len(reader.pages),"rendered":5}))
