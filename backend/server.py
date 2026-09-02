from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

IMG = "https://images.unsplash.com/"

MENU_SEED = [
    {"id": "poke-kalama", "category": "poke", "name_it": "Poké Kalama", "name_en": "Kalama Poké", "desc_it": "Salmone fresco, riso, avocado, mango, edamame e salsa Kalama segreta.", "desc_en": "Fresh salmon, rice, avocado, mango, edamame and our secret Kalama sauce.", "price": 12.90, "tag_it": "Più amato", "tag_en": "Best seller", "image": IMG + "photo-1597958792579-bd3517df6399?q=80&w=800&auto=format&fit=crop"},
    {"id": "poke-tonno", "category": "poke", "name_it": "Poké Tonno", "name_en": "Tuna Poké", "desc_it": "Tonno abbattuto, cetriolo, sesamo tostato, alghe wakame e salsa di soia.", "desc_en": "Flash-frozen tuna, cucumber, toasted sesame, wakame seaweed and soy sauce.", "price": 13.50, "tag_it": "", "tag_en": "", "image": IMG + "photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop"},
    {"id": "poke-gamberi", "category": "poke", "name_it": "Poké Gamberi", "name_en": "Shrimp Poké", "desc_it": "Gamberi tropicali, ananas, peperoni, cipolla rossa e mayo piccante.", "desc_en": "Tropical shrimp, pineapple, peppers, red onion and spicy mayo.", "price": 13.90, "tag_it": "Piccante", "tag_en": "Spicy", "image": IMG + "photo-1565680018434-b513d5e5fd47?q=80&w=800&auto=format&fit=crop"},
    {"id": "burger-classic", "category": "burger", "name_it": "Fish Burger Classic", "name_en": "Classic Fish Burger", "desc_it": "Merluzzo panato croccante, cheddar fuso, lattuga e salsa tartara.", "desc_en": "Crispy breaded cod, melted cheddar, lettuce and tartar sauce.", "price": 9.90, "tag_it": "Più amato", "tag_en": "Best seller", "image": IMG + "photo-1671522635273-f70d28b00493?q=80&w=800&auto=format&fit=crop"},
    {"id": "burger-salmone", "category": "burger", "name_it": "Salmon Burger", "name_en": "Salmon Burger", "desc_it": "Burger di salmone fresco, rucola, pomodoro e maionese al lime.", "desc_en": "Fresh salmon patty, arugula, tomato and lime mayo.", "price": 11.50, "tag_it": "", "tag_en": "", "image": IMG + "photo-1771875600033-ad2a71d3fe98?q=80&w=800&auto=format&fit=crop"},
    {"id": "burger-gambero", "category": "burger", "name_it": "Shrimp Burger", "name_en": "Shrimp Burger", "desc_it": "Polpa di gamberi, insalata croccante e salsa cocktail rosa.", "desc_en": "Shrimp meat patty, crunchy salad and pink cocktail sauce.", "price": 11.90, "tag_it": "Novità", "tag_en": "New", "image": IMG + "photo-1559742811-822873691df8?q=80&w=800&auto=format&fit=crop"},
    {"id": "fritto-misto", "category": "fritti", "name_it": "Fritto Misto Kalama", "name_en": "Kalama Mixed Fry", "desc_it": "Calamari, gamberi e alici in pastella leggera, serviti nel cartoccio.", "desc_en": "Squid, shrimp and anchovies in a light batter, served street-food style.", "price": 10.90, "tag_it": "Più amato", "tag_en": "Best seller", "image": IMG + "photo-1615141982883-c7ad0e69fd62?q=80&w=800&auto=format&fit=crop"},
    {"id": "fish-chips", "category": "fritti", "name_it": "Fish & Chips", "name_en": "Fish & Chips", "desc_it": "Merluzzo in pastella alla birra con patatine e salsa allo yogurt.", "desc_en": "Beer-battered cod with fries and yogurt sauce.", "price": 9.50, "tag_it": "", "tag_en": "", "image": IMG + "photo-1579208030886-b937da0925dc?q=80&w=800&auto=format&fit=crop"},
    {"id": "calamari", "category": "fritti", "name_it": "Anelli di Calamaro", "name_en": "Calamari Rings", "desc_it": "Anelli dorati e croccanti con maionese al prezzemolo.", "desc_en": "Golden crispy rings with parsley mayo.", "price": 8.50, "tag_it": "", "tag_en": "", "image": IMG + "photo-1559847844-5315695dadae?q=80&w=800&auto=format&fit=crop"},
    {"id": "insalata-mare", "category": "mare", "name_it": "Insalata di Mare", "name_en": "Seafood Salad", "desc_it": "Polpo, calamari, gamberi, sedano croccante e citronette.", "desc_en": "Octopus, squid, shrimp, crunchy celery and citronette.", "price": 12.50, "tag_it": "", "tag_en": "", "image": IMG + "photo-1467003909585-2f8a72700288?q=80&w=800&auto=format&fit=crop"},
    {"id": "paella", "category": "mare", "name_it": "Paella di Pesce", "name_en": "Seafood Paella", "desc_it": "Riso allo zafferano con cozze, vongole, gamberi e calamari.", "desc_en": "Saffron rice with mussels, clams, shrimp and squid.", "price": 14.90, "tag_it": "Novità", "tag_en": "New", "image": IMG + "photo-1534080564583-6be75777b70a?q=80&w=800&auto=format&fit=crop"},
    {"id": "salmone", "category": "mare", "name_it": "Salmone alla Griglia", "name_en": "Grilled Salmon", "desc_it": "Filetto di salmone grigliato con verdure di stagione.", "desc_en": "Grilled salmon fillet with seasonal vegetables.", "price": 13.90, "tag_it": "", "tag_en": "", "image": IMG + "photo-1611599537845-1c7aca0091c0?q=80&w=800&auto=format&fit=crop"},
]


class ContactMessage(BaseModel):
    name: str
    email: str
    message: str


class FranchiseInquiry(BaseModel):
    name: str
    email: str
    phone: str
    city: str
    message: Optional[str] = ""


@api_router.get("/")
async def root():
    return {"message": "Kalama API", "status": "ok"}


@api_router.get("/menu")
async def get_menu():
    return await db.menu_items.find({}, {"_id": 0}).to_list(100)


@api_router.post("/contact")
async def create_contact(msg: ContactMessage):
    doc = msg.model_dump()
    doc.update({"id": str(uuid.uuid4()), "type": "contact",
                "created_at": datetime.now(timezone.utc).isoformat()})
    await db.messages.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@api_router.post("/franchising")
async def create_franchise(inq: FranchiseInquiry):
    doc = inq.model_dump()
    doc.update({"id": str(uuid.uuid4()), "type": "franchising",
                "created_at": datetime.now(timezone.utc).isoformat()})
    await db.messages.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@app.on_event("startup")
async def seed_menu():
    if await db.menu_items.count_documents({}) == 0:
        await db.menu_items.insert_many(MENU_SEED)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
