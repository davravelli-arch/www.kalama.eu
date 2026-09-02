import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
API = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].splitlines()[0].strip() + "/api"
token = requests.post(f"{API}/admin/login", json={"password": os.environ["ADMIN_PASSWORD"]}).json()["token"]
H = {"Authorization": f"Bearer {token}"}


def upload(path, mime):
    with open(path, "rb") as f:
        r = requests.post(f"{API}/admin/upload", headers=H, files={"file": (os.path.basename(path), f, mime)})
    r.raise_for_status()
    return r.json()["url"]


cone = upload("/app/assets/calamari_fritti_grande.webp", "image/webp")
grill = upload("/app/assets/calamari_gamberi_griglia.jpg", "image/webp")
print("uploaded", cone, grill)

items = {i["id"]: i for i in requests.get(f"{API}/admin/menu", headers=H).json()}
assign = {
    "malaga-calamari-grandi": cone, "malta-calamari-grandi": cone,
    "malaga-spiedini-calamari-gamberi": grill, "malta-spiedini-calamari-gamberi": grill,
}
for item_id, url in assign.items():
    it = dict(items[item_id]); it["image"] = url
    requests.put(f"{API}/admin/menu/{item_id}", headers=H, json=it).raise_for_status()

requests.put(f"{API}/admin/site-images/hero", headers=H, json={"value": cone}).raise_for_status()
requests.put(f"{API}/admin/site-images/gallery", headers=H, json={"value": [cone, grill]}).raise_for_status()
print("done", requests.get(f"{API}/site-images").json())
sys.exit(0)
