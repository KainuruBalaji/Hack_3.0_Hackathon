import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from PyPDF2 import PdfReader

reader = PdfReader(r'c:\Users\kainu\Documents\LLM\HACK3.0\HackwithHyderabad 3.0 Problem Statament.pdf')
with open(r'c:\Users\kainu\Documents\LLM\HACK3.0\pdf_content.txt', 'w', encoding='utf-8') as f:
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            f.write(f"=== PAGE {i+1} ===\n")
            f.write(text)
            f.write("\n\n")
print("Done writing to pdf_content.txt")
