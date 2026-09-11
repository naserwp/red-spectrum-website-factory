from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
root=Path(__file__).resolve().parents[1]
customer=root/"customers/swenzy-logistics"
delivery=customer/"delivery"
source=delivery/"swenzy-logistics-source.zip"
paths=[]
for directory in ["app","components","lib","public","scripts","vendor","templates"]:
    for path in (root/directory).rglob("*"):
        if path.is_file() and "__pycache__" not in path.parts:
            # Never bundle a different real customer's public assets.
            relative=path.relative_to(root).as_posix()
            if relative.startswith("public/customers/") and not relative.startswith("public/customers/swenzy-logistics/"):
                continue
            paths.append(path)
for name in ["package.json","package-lock.json","next.config.ts","next-env.d.ts","tsconfig.json","postcss.config.mjs","eslint.config.mjs","components.json","vercel.json",".env.example",".gitignore",".npmrc","README.md","cloudflare-env.d.ts","drizzle.config.ts"]:
    if (root/name).is_file():paths.append(root/name)
paths.extend([root/"customers/manifest.json",customer/"site/customer.config.json",customer/"README.md"])
with ZipFile(source,"w",ZIP_DEFLATED,strict_timestamps=False) as archive:
    for path in sorted(set(paths)):archive.write(path,path.relative_to(root))
with ZipFile(source) as archive:
    assert ".env.local" not in archive.namelist()
    assert not any("/brief/" in n and n.startswith("customers/") for n in archive.namelist())
package=delivery/"swenzy-logistics-review-package.zip"
website_pdf=delivery/"swenzy-logistics-website-deployed.pdf"
if not website_pdf.is_file():
    website_pdf=delivery/"swenzy-logistics-website.pdf"
with ZipFile(package,"w",ZIP_DEFLATED,strict_timestamps=False) as archive:
    for path in [source,website_pdf,delivery/"README.md"]:
        archive.write(path,path.name)
    for directory in ["brand","myndy","outreach","site"]:
        for path in (customer/directory).rglob("*"):
            if path.is_file():archive.write(path,path.relative_to(customer))
    for path in (root/"public/customers/swenzy-logistics").rglob("*"):
        if path.is_file():archive.write(path,"web-assets/"+str(path.relative_to(root/"public/customers/swenzy-logistics")))
    for path in (customer/"qa").iterdir():
        if path.is_file() and path.suffix in [".md",".json"]:
            archive.write(path,path.relative_to(customer))
    for name in ["before-existing-site.png","home-desktop.png","home-mobile.png","myndy-mobile-open.png"]:
        archive.write(customer/"qa"/name,"screenshots/"+name)
print(json.dumps({"source":str(source),"sourceFiles":len(paths),"package":str(package),"packageBytes":package.stat().st_size}))
