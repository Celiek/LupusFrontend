
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# 📌 STARTOWE DANE
project_root = "."  # katalog, w którym uruchamiasz skrypt
base_url = "http://127.0.0.1:5500/"  # Twój lokalny serwer (np. Live Server)
placeholder_links = ['#', '', 'javascript:void(0)', 'javascript:;', 'about:blank']

broken_links = []

# 📁 PRZECHODZENIE PO PLIKACH HTML
for root, dirs, files in os.walk(project_root):
    for file in files:
        if file.endswith(".html"):
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, project_root)
            with open(full_path, "r", encoding="utf-8") as f:
                soup = BeautifulSoup(f, 'html.parser')

            for tag in soup.find_all('a', href=True):
                href = tag['href'].strip()
                full_url = urljoin(base_url + rel_path.replace("\\", "/"), href)

                # placeholdery
                if href.lower() in placeholder_links or href.lower().startswith("javascript:"):
                    broken_links.append((rel_path, href, "Placeholder"))
                    continue

                try:
                    r = requests.head(full_url, allow_redirects=True, timeout=3)
                    if r.status_code >= 400:
                        broken_links.append((rel_path, href, f"HTTP {r.status_code}"))
                except Exception as e:
                    broken_links.append((rel_path, href, f"Error: {e}"))

# 📢 WYNIKI
print("\n🛑 BŁĘDNE LINKI:\n")
if broken_links:
    for file_path, href, reason in broken_links:
        print(f"- Plik: {file_path}")
        print(f"  ➤ Link: {href}")
        print(f"  ⚠️ Powód: {reason}\n")
else:
    print("✅ Wszystkie linki działają poprawnie.")
