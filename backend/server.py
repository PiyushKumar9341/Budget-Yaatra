"""Budget Yatra – FastAPI backend
Authentic Indian travel discovery with AI trip planner + chatbot + Google auth.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Cookie, Header
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, uuid, logging, json, httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="Budget Yatra API")
api_router = APIRouter(prefix="/api")

# ============ SEED DATA ============
DESTINATIONS_SEED = [
    {
        "slug": "meghalaya",
        "name": "Meghalaya",
        "tagline": "Abode of clouds — living root bridges & waterfalls",
        "region": "North East",
        "state": "Meghalaya",
        "best_season": "Sep – Mar",
        "budget_per_day": 1800,
        "vibe": "Misty, lush green, rainfall, rivers",
        "hero_image": "https://images.unsplash.com/photo-1637043765564-a071ff91a09f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwxfHxtZWdoYWxheWElMjByaXZlciUyMG1pc3R8ZW58MHx8fHwxNzg1MjM0OTQ1fDA&ixlib=rb-4.1.0&q=85",
        "coords": {"lat": 25.4670, "lng": 91.3662},
        "highlights": ["Living Root Bridges - Nongriat", "Dawki crystal river", "Cherrapunji waterfalls", "Mawlynnong (Asia's cleanest village)"],
        "stays": [
            {"name": "Serene Homestay, Sohra", "type": "Homestay", "price": 900, "note": "Grandma's kitchen, warm blankets", "lat": 25.2702, "lng": 91.7323},
            {"name": "Mawlynnong Village Guest House", "type": "Village Stay", "price": 1200, "note": "Family run, bamboo huts", "lat": 25.2000, "lng": 91.9166},
            {"name": "Dawki Riverside Camp", "type": "Tent", "price": 1500, "note": "Sleep next to Umngot river", "lat": 25.1854, "lng": 92.0217}
        ],
        "food_spots": [
            {"name": "Trattoria, Police Bazaar", "dish": "Jadoh + Doh Khlieh", "price": 180, "lat": 25.5760, "lng": 91.8933, "note": "Tiny local Khasi kitchen since 1979"},
            {"name": "Delhi Mistan Bhandar (chai stall)", "dish": "Cutting chai + samosa", "price": 30, "lat": 25.5770, "lng": 91.8933, "note": "Chhoti si dukaan, best chai in Shillong"},
            {"name": "Cafe Shillong (bakery corner)", "dish": "Sohra pork + red rice", "price": 250, "lat": 25.5695, "lng": 91.8811, "note": "Local musicians play live"}
        ],
        "rentals": [
            {"name": "Ri Kynjai Bike Rentals, Police Bazaar", "type": "Scooter/Bike", "vehicle": "Activa / Royal Enfield", "price_per_day": 800, "lat": 25.5762, "lng": 91.8935, "note": "No paperwork drama, Aadhar copy enough"},
            {"name": "Dorbar Auto Stand, Sohra", "type": "Shared Auto", "vehicle": "Auto to root bridges", "price_per_day": 400, "lat": 25.2700, "lng": 91.7325, "note": "Group of 4, 1 day trip to Nongriat base"},
            {"name": "Nongriat Bamboo Cycles", "type": "Cycle", "vehicle": "Mountain cycle", "price_per_day": 250, "lat": 25.2565, "lng": 91.7150, "note": "For village-hopping, chhoti dukaan"}
        ],
        "guides": [
            {"name": "Bah Nikhil Khongsit", "specialty": "Living root bridges + Khasi folklore", "price_per_day": 900, "languages": "Khasi, Hindi, English", "lat": 25.2698, "lng": 91.7325, "note": "Local Khasi guide, ex-teacher, 12 yrs experience"},
            {"name": "Iaishah Village Guide Collective", "specialty": "Mawlynnong + waterfalls", "price_per_day": 700, "languages": "Khasi, English", "lat": 25.2005, "lng": 91.9166, "note": "Community-run, women-led group"}
        ]
    },
    {
        "slug": "ladakh",
        "name": "Ladakh",
        "tagline": "Land of high passes — barren beauty & prayer flags",
        "region": "Himalayas",
        "state": "Ladakh",
        "best_season": "May – Sep",
        "budget_per_day": 2500,
        "vibe": "Barren ochre, high altitude stark blue, prayer flags",
        "hero_image": "https://images.pexels.com/photos/12410632/pexels-photo-12410632.jpeg",
        "coords": {"lat": 34.1526, "lng": 77.5771},
        "highlights": ["Pangong Tso lake", "Nubra Valley sand dunes", "Magnetic Hill", "Thiksey Monastery", "Khardung La pass"],
        "stays": [
            {"name": "Dolma's Homestay, Leh", "type": "Homestay", "price": 1100, "note": "Ladakhi thukpa breakfast included", "lat": 34.1642, "lng": 77.5848},
            {"name": "Pangong Tents", "type": "Tent", "price": 1800, "note": "Lakeside, million stars", "lat": 33.7500, "lng": 78.6667},
            {"name": "Turtuk Village Home", "type": "Village Stay", "price": 900, "note": "Last village before Pakistan", "lat": 34.8542, "lng": 76.8272}
        ],
        "food_spots": [
            {"name": "Tibetan Kitchen, Fort Road", "dish": "Momos + Thukpa", "price": 200, "lat": 34.1655, "lng": 77.5843, "note": "Run by refugee family, 20+ years"},
            {"name": "Lala's Cafe (old town)", "dish": "Apricot juice + khambir bread", "price": 120, "lat": 34.1620, "lng": 77.5859, "note": "Inside 400 yr old Ladakhi house"},
            {"name": "Neha Snacks, Leh Bazaar", "dish": "Skyu (Ladakhi pasta)", "price": 150, "lat": 34.1636, "lng": 77.5850, "note": "Auntie ki chhoti dukaan"}
        ],
        "rentals": [
            {"name": "Ladakh Bike House, Fort Road", "type": "Bike", "vehicle": "Royal Enfield Himalayan", "price_per_day": 1400, "lat": 34.1650, "lng": 77.5843, "note": "Best for Pangong / Nubra, helmet included"},
            {"name": "Tsering Taxi Union", "type": "Shared Taxi", "vehicle": "Innova / Xylo", "price_per_day": 4500, "lat": 34.1642, "lng": 77.5845, "note": "Local union rate — no online booking markup"},
            {"name": "Old Town Cycle Wallah", "type": "Cycle", "vehicle": "MTB", "price_per_day": 300, "lat": 34.1636, "lng": 77.5850, "note": "For Leh city ride, downhill fun"}
        ],
        "guides": [
            {"name": "Stanzin Namgail", "specialty": "Himalayan trekking + monasteries", "price_per_day": 1500, "languages": "Ladakhi, Hindi, English", "lat": 34.1650, "lng": 77.5850, "note": "Certified mountaineer, born in Leh"},
            {"name": "Deldan (bike tour lead)", "specialty": "Nubra + Pangong bike route safety", "price_per_day": 1200, "languages": "Hindi, English", "lat": 34.1640, "lng": 77.5840, "note": "Ex-army, 15+ Ladakh rides led"}
        ]
    },
    {
        "slug": "rishikesh",
        "name": "Rishikesh",
        "tagline": "Where Ganga meets the yogis — river, rafting, ram jhula",
        "region": "Himalayan foothills",
        "state": "Uttarakhand",
        "best_season": "Sep – Apr",
        "budget_per_day": 1200,
        "vibe": "Spiritual saffron, river teal, sand, peaceful",
        "hero_image": "https://images.unsplash.com/photo-1719581827279-e9a8d8fce924",
        "coords": {"lat": 30.0869, "lng": 78.2676},
        "highlights": ["Ram Jhula & Lakshman Jhula", "Triveni Ghat aarti", "White water rafting", "Beatles Ashram", "Neelkanth Mahadev"],
        "stays": [
            {"name": "Ganga Kinare Homestay", "type": "Homestay", "price": 700, "note": "Riverside, aarti view from balcony", "lat": 30.1195, "lng": 78.3210},
            {"name": "Tapovan Yoga Cottage", "type": "Ashram Stay", "price": 500, "note": "Free morning yoga + satvik food", "lat": 30.1279, "lng": 78.3134},
            {"name": "Shivpuri Riverside Camp", "type": "Tent", "price": 1100, "note": "Rafting base camp", "lat": 30.1583, "lng": 78.4083}
        ],
        "food_spots": [
            {"name": "Chotiwala Restaurant, Swarg Ashram", "dish": "Thali + lassi", "price": 200, "lat": 30.1178, "lng": 78.3224, "note": "Iconic since 1958, purely veg"},
            {"name": "Baba Kali Kamli Wala (chai)", "dish": "Ginger chai + mathri", "price": 25, "lat": 30.1191, "lng": 78.3222, "note": "Sadhu ki dukaan near ghat"},
            {"name": "Little Buddha Cafe", "dish": "Curd rice + falafel", "price": 250, "lat": 30.1265, "lng": 78.3140, "note": "Overlooks the Ganga"}
        ],
        "rentals": [
            {"name": "Ganga Bike Rentals, Tapovan", "type": "Scooter", "vehicle": "Activa / Jupiter", "price_per_day": 500, "lat": 30.1279, "lng": 78.3134, "note": "10 min from Lakshman Jhula, DL needed"},
            {"name": "Rishikesh Auto Union Stand", "type": "Shared Auto", "vehicle": "Auto to Neelkanth", "price_per_day": 300, "lat": 30.1050, "lng": 78.2933, "note": "Fixed union rate, no bargaining stress"},
            {"name": "Cycle Yatra, Swarg Ashram", "type": "Cycle", "vehicle": "Hybrid cycle", "price_per_day": 200, "lat": 30.1178, "lng": 78.3224, "note": "For ghat-to-ghat exploration"}
        ],
        "guides": [
            {"name": "Pandit Anil Ji", "specialty": "Aarti + spiritual walks + ashram history", "price_per_day": 600, "languages": "Hindi, English, Sanskrit basics", "lat": 30.1191, "lng": 78.3222, "note": "3rd gen priest family, gentle storyteller"},
            {"name": "Adventure Ashram Team", "specialty": "Rafting + Beatles ashram trail", "price_per_day": 800, "languages": "Hindi, English", "lat": 30.1279, "lng": 78.3134, "note": "Certified river guides, safety-first"}
        ]
    },
    {
        "slug": "manali",
        "name": "Manali",
        "tagline": "Pine forest, apple orchards, snow-capped peaks",
        "region": "Himalayas",
        "state": "Himachal Pradesh",
        "best_season": "Oct – Feb (snow), Mar – Jun (green)",
        "budget_per_day": 1500,
        "vibe": "Snow white, pine green, rustic wood, cold breeze",
        "hero_image": "https://images.pexels.com/photos/14406133/pexels-photo-14406133.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "coords": {"lat": 32.2396, "lng": 77.1887},
        "highlights": ["Solang Valley", "Rohtang Pass", "Hidimba Devi temple", "Old Manali cafes", "Jogini falls trek"],
        "stays": [
            {"name": "Old Manali Wooden Cottage", "type": "Cottage", "price": 1200, "note": "100 year old walnut wood house", "lat": 32.2582, "lng": 77.1737},
            {"name": "Vashisht Village Homestay", "type": "Homestay", "price": 800, "note": "Natural hot spring next door", "lat": 32.2649, "lng": 77.1875},
            {"name": "Sethan Snow Camp", "type": "Tent", "price": 1400, "note": "Igloo option in Jan-Feb", "lat": 32.2431, "lng": 77.2472}
        ],
        "food_spots": [
            {"name": "Sher-e-Punjab Dhaba, Mall Road", "dish": "Rajma chawal", "price": 150, "lat": 32.2432, "lng": 77.1892, "note": "Truck driver approved since 1972"},
            {"name": "Cafe 1947, Old Manali", "dish": "Trout fish + apple pie", "price": 350, "lat": 32.2601, "lng": 77.1743, "note": "Beas river view, live music"},
            {"name": "Johnson's Bakery", "dish": "Apple strudel + coffee", "price": 180, "lat": 32.2411, "lng": 77.1899, "note": "Grandma still bakes daily"}
        ],
        "rentals": [
            {"name": "Manali Bike Point, Mall Road", "type": "Bike", "vehicle": "Royal Enfield / Himalayan", "price_per_day": 1200, "lat": 32.2432, "lng": 77.1892, "note": "For Rohtang / Spiti circuit"},
            {"name": "Old Manali Scooter Wallah", "type": "Scooter", "vehicle": "Activa", "price_per_day": 600, "lat": 32.2582, "lng": 77.1737, "note": "Kunal bhai, ID copy + Rs 500 deposit"},
            {"name": "Solang Valley Cabs", "type": "Shared Taxi", "vehicle": "Innova for day trip", "price_per_day": 3000, "lat": 32.3167, "lng": 77.1583, "note": "Union rate, split with 6 pax"}
        ],
        "guides": [
            {"name": "Tashi (Old Manali Treks)", "specialty": "Bhrigu Lake + Jogini falls", "price_per_day": 1000, "languages": "Hindi, English, basic Israeli", "lat": 32.2590, "lng": 77.1740, "note": "20+ yrs, Beas Kund permit expert"},
            {"name": "Hidimba Cultural Walk", "specialty": "Kullu-Manali temples + folk", "price_per_day": 500, "languages": "Hindi, Kullvi", "lat": 32.2489, "lng": 77.1836, "note": "Local heritage volunteer"}
        ]
    },
    {
        "slug": "spiti",
        "name": "Spiti Valley",
        "tagline": "The middle land — moon on earth",
        "region": "Trans-Himalaya",
        "state": "Himachal Pradesh",
        "best_season": "May – Oct",
        "budget_per_day": 2000,
        "vibe": "Raw desert, muted sand, deep altitude blue, silence",
        "hero_image": "https://images.pexels.com/photos/31346573/pexels-photo-31346573.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "coords": {"lat": 32.2464, "lng": 78.0349},
        "highlights": ["Key Monastery", "Chandratal Lake", "Hikkim (world's highest post office)", "Langza Buddha statue", "Pin Valley"],
        "stays": [
            {"name": "Sonam Homestay, Kaza", "type": "Homestay", "price": 1000, "note": "Mudbrick house, yak butter tea", "lat": 32.2264, "lng": 78.0715},
            {"name": "Langza Village Home", "type": "Village Stay", "price": 800, "note": "14,500 ft — fossils in backyard", "lat": 32.2938, "lng": 78.0431},
            {"name": "Kibber Highland Cafe & Stay", "type": "Homestay", "price": 1100, "note": "Snow leopard territory", "lat": 32.3333, "lng": 78.0167}
        ],
        "food_spots": [
            {"name": "Himalayan Cafe, Kaza", "dish": "Chhurpi soup + tingmo", "price": 180, "lat": 32.2265, "lng": 78.0720, "note": "Only 4 tables, run by monks' family"},
            {"name": "Sol Cafe, Kaza market", "dish": "Seabuckthorn juice + momos", "price": 200, "lat": 32.2271, "lng": 78.0712, "note": "Bookshelf + vinyl records"},
            {"name": "Kunzum Top Chai Stall", "dish": "Maggi + kahwa", "price": 80, "lat": 32.4103, "lng": 77.6383, "note": "15,000 ft, chhoti tapri"}
        ],
        "rentals": [
            {"name": "Spiti Bike Rentals, Kaza", "type": "Bike", "vehicle": "Royal Enfield 350", "price_per_day": 1300, "lat": 32.2265, "lng": 78.0715, "note": "Only local shop, high-altitude tuned"},
            {"name": "Kaza Taxi Union", "type": "Shared Taxi", "vehicle": "Xylo for circuit", "price_per_day": 5000, "lat": 32.2264, "lng": 78.0712, "note": "Kibber + Langza + Key covered"}
        ],
        "guides": [
            {"name": "Chhering Dorje", "specialty": "Fossils, monastery walks, homestay circuit", "price_per_day": 1200, "languages": "Spitian, Hindi, English", "lat": 32.2264, "lng": 78.0715, "note": "Born in Langza, guides since 2008"},
            {"name": "Ecosphere Spiti", "specialty": "Snow leopard tracking + Pin Valley", "price_per_day": 2000, "languages": "Hindi, English", "lat": 32.2260, "lng": 78.0715, "note": "Local NGO, conservation-focused"}
        ]
    },
    {
        "slug": "sikkim",
        "name": "Sikkim",
        "tagline": "Kanchenjunga's silent guardian — orchids & monasteries",
        "region": "Eastern Himalayas",
        "state": "Sikkim",
        "best_season": "Mar – May, Oct – Dec",
        "budget_per_day": 1800,
        "vibe": "Alpine green, prayer flags, orchid pink, kanchenjunga white",
        "hero_image": "https://images.unsplash.com/photo-1544461772-3ce4b8d92f5f?w=1600",
        "coords": {"lat": 27.5330, "lng": 88.5122},
        "highlights": ["Tsomgo Lake", "Nathula Pass", "Yumthang valley of flowers", "Pelling Kanchenjunga view", "Rumtek Monastery"],
        "stays": [
            {"name": "Yuksom Village Homestay", "type": "Homestay", "price": 900, "note": "Trek base for Goecha La", "lat": 27.3706, "lng": 88.2211},
            {"name": "Lachung Farm Stay", "type": "Farm Stay", "price": 1100, "note": "Apple + kiwi orchards", "lat": 27.6890, "lng": 88.7415}
        ],
        "food_spots": [
            {"name": "Roll House, MG Marg Gangtok", "dish": "Beef momo + phaley", "price": 150, "lat": 27.3389, "lng": 88.6065, "note": "Rolls since 1985"},
            {"name": "Baker's Cafe, Gangtok", "dish": "Wai wai chowmein", "price": 100, "lat": 27.3308, "lng": 88.6120, "note": "Students hangout"}
        ],
        "rentals": [
            {"name": "Sikkim Bike Wala, MG Marg", "type": "Scooter/Bike", "vehicle": "Activa / Duke 250", "price_per_day": 900, "lat": 27.3389, "lng": 88.6065, "note": "For Gangtok city + short hops"},
            {"name": "North Sikkim Shared Cab Stand", "type": "Shared Taxi", "vehicle": "Sumo to Lachung/Yumthang", "price_per_day": 600, "lat": 27.3305, "lng": 88.6115, "note": "Per seat basis, book 1 day ahead"}
        ],
        "guides": [
            {"name": "Karma (Yuksom Trek Lead)", "specialty": "Goecha La + Kanchenjunga base treks", "price_per_day": 1300, "languages": "Sikkimese, Hindi, English", "lat": 27.3706, "lng": 88.2211, "note": "Certified mountaineer, 18 yrs"},
            {"name": "Pemayangtse Heritage Walk", "specialty": "Monasteries + Buddhist history", "price_per_day": 700, "languages": "Hindi, English", "lat": 27.3050, "lng": 88.2469, "note": "Monk-trained cultural guide"}
        ]
    },
    {
        "slug": "kasol",
        "name": "Kasol",
        "tagline": "Mini Israel of India — Parvati river & pine",
        "region": "Himalayas",
        "state": "Himachal Pradesh",
        "best_season": "Mar – Jun, Sep – Nov",
        "budget_per_day": 1000,
        "vibe": "River blue, pine green, chillum smoke, banter",
        "hero_image": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600",
        "coords": {"lat": 32.0100, "lng": 77.3150},
        "highlights": ["Kheerganga trek", "Tosh village", "Chalal walk", "Manikaran Sahib gurudwara", "Malana"],
        "stays": [
            {"name": "Riverside Camp Kasol", "type": "Tent", "price": 600, "note": "Wake up to Parvati's roar", "lat": 32.0104, "lng": 77.3155},
            {"name": "Tosh Highland Home", "type": "Homestay", "price": 700, "note": "Wooden balcony, valley view", "lat": 32.0247, "lng": 77.3728}
        ],
        "food_spots": [
            {"name": "Evergreen Cafe, Kasol", "dish": "Shakshuka + hummus", "price": 220, "lat": 32.0113, "lng": 77.3155, "note": "Israeli couple's tiny cafe"},
            {"name": "Buddha Place, Tosh", "dish": "Trout thali", "price": 250, "lat": 32.0245, "lng": 77.3728, "note": "Cliffside seating"}
        ],
        "rentals": [
            {"name": "Kasol Bike Point", "type": "Bike/Scooter", "vehicle": "Activa / Bullet", "price_per_day": 700, "lat": 32.0104, "lng": 77.3155, "note": "For Tosh/Malana runs, ID needed"},
            {"name": "Parvati Cab Union", "type": "Shared Taxi", "vehicle": "Tempo to Manikaran/Barshaini", "price_per_day": 200, "lat": 32.0100, "lng": 77.3150, "note": "Per seat, morning + evening"}
        ],
        "guides": [
            {"name": "Kheerganga Trail Guides Co-op", "specialty": "Kheerganga + Tosh + Malana treks", "price_per_day": 800, "languages": "Hindi, English, basic Hebrew", "lat": 32.0108, "lng": 77.3160, "note": "Local Parvati Valley collective"},
            {"name": "Ram (photo trail expert)", "specialty": "Instagram photo spots + hidden waterfalls", "price_per_day": 600, "languages": "Hindi, English", "lat": 32.0245, "lng": 77.3728, "note": "Great for solo Gen-Z travellers"}
        ]
    },
    {
        "slug": "tawang",
        "name": "Tawang",
        "tagline": "Monastery of monasteries — Arunachal's crown jewel",
        "region": "Eastern Himalayas",
        "state": "Arunachal Pradesh",
        "best_season": "Mar – Oct",
        "budget_per_day": 2200,
        "vibe": "Ancient monastery gold, alpine mist, prayer wheels",
        "hero_image": "https://images.unsplash.com/photo-1580500550469-4c1e1a25ca34?w=1600",
        "coords": {"lat": 27.5859, "lng": 91.8594},
        "highlights": ["Tawang Monastery (400 yrs old)", "Sela Pass", "Madhuri Lake (Sangetsar)", "PTSO Lake", "Bumla Pass (India-China border)"],
        "stays": [
            {"name": "Dorjee Khandu Homestay", "type": "Homestay", "price": 1000, "note": "Monpa family, butter tea daily", "lat": 27.5860, "lng": 91.8600},
            {"name": "Dirang Boutique Stay", "type": "Cottage", "price": 1400, "note": "Enroute Tawang, hot spring", "lat": 27.3597, "lng": 92.2472}
        ],
        "food_spots": [
            {"name": "Dragon Restaurant, Old Market", "dish": "Thukpa + zan (millet cake)", "price": 200, "lat": 27.5850, "lng": 91.8590, "note": "Grandma-run Monpa kitchen"}
        ],
        "rentals": [
            {"name": "Bomdila Cab Union", "type": "Shared Taxi", "vehicle": "Innova (Guwahati → Tawang)", "price_per_day": 6000, "lat": 27.2647, "lng": 92.4247, "note": "2-day journey, split among 6"},
            {"name": "Tawang Sumo Stand", "type": "Shared Sumo", "vehicle": "Sumo for Sela + Bumla", "price_per_day": 400, "lat": 27.5859, "lng": 91.8594, "note": "Per seat rate to nearby passes"}
        ],
        "guides": [
            {"name": "Lobsang (Tawang Monastery walks)", "specialty": "Monastery history + Monpa culture", "price_per_day": 900, "languages": "Monpa, Hindi, English", "lat": 27.5860, "lng": 91.8600, "note": "Ex-monk, spent 8 yrs at Tawang gompa"},
            {"name": "Sela Pass Adventure", "specialty": "High-altitude photo + lake trails", "price_per_day": 1100, "languages": "Hindi, English", "lat": 27.5000, "lng": 92.1042, "note": "Winter permits handled"}
        ]
    },
    {
        "slug": "kashmir",
        "name": "Kashmir",
        "tagline": "Chinar leaves, shikara rides — paradise on earth",
        "region": "Himalayas",
        "state": "Jammu & Kashmir",
        "best_season": "Apr – Oct (summer), Dec – Feb (snow)",
        "budget_per_day": 2000,
        "vibe": "Chinar red, dal lake teal, saffron warmth, snow mountain",
        "hero_image": "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1600&q=85",
        "coords": {"lat": 34.0837, "lng": 74.7973},
        "highlights": ["Shikara ride on Dal Lake", "Gulmarg gondola (world's 2nd highest)", "Pahalgam Betaab Valley", "Sonmarg meadows", "Mughal gardens - Shalimar Bagh"],
        "stays": [
            {"name": "Zaina Kadal Houseboat, Dal Lake", "type": "Houseboat", "price": 1400, "note": "Wooden carvings, kahwa served on deck", "lat": 34.1114, "lng": 74.8797},
            {"name": "Pahalgam Village Homestay", "type": "Homestay", "price": 900, "note": "Lidder river next door, walnut wood house", "lat": 34.0161, "lng": 75.3211},
            {"name": "Aru Valley Shepherd Camp", "type": "Tent", "price": 1200, "note": "Base camp for treks, bonfire nights", "lat": 34.1006, "lng": 75.2650}
        ],
        "food_spots": [
            {"name": "Ahdoos, Residency Road", "dish": "Rogan josh + tabak maaz", "price": 350, "lat": 34.0836, "lng": 74.7995, "note": "Iconic Kashmiri wazwan since 1918"},
            {"name": "Krishna Dhaba, Durga Nag", "dish": "Rajma chawal + kahwa", "price": 150, "lat": 34.0854, "lng": 74.8390, "note": "Locals-only, run by 3 generations"},
            {"name": "Chai Jaai, Habba Kadal", "dish": "Nun chai + sheermal", "price": 80, "lat": 34.0997, "lng": 74.8103, "note": "Tiny corner shop near old city bridge"}
        ],
        "rentals": [
            {"name": "Dal Lake Shikara Ghat 3", "type": "Shikara", "vehicle": "Traditional wooden shikara", "price_per_day": 800, "lat": 34.1114, "lng": 74.8797, "note": "Half-day rate, no commission — direct owner"},
            {"name": "Srinagar Auto Stand, Lal Chowk", "type": "Auto", "vehicle": "Auto in Srinagar city", "price_per_day": 500, "lat": 34.0836, "lng": 74.7995, "note": "Fixed union rate for city hopping"},
            {"name": "Pahalgam Pony Wallah Union", "type": "Pony", "vehicle": "Horse for Baisaran valley", "price_per_day": 700, "lat": 34.0161, "lng": 75.3211, "note": "Regulated union, no bargaining"}
        ],
        "guides": [
            {"name": "Bilal (Kashmir Cultural Walks)", "specialty": "Old Srinagar + shrines + hidden mosques", "price_per_day": 1000, "languages": "Kashmiri, Urdu, English", "lat": 34.0997, "lng": 74.8103, "note": "3rd gen Srinagar local, historian"},
            {"name": "Gulmarg Ski Instructor Union", "specialty": "Skiing + gondola safety", "price_per_day": 1500, "languages": "Kashmiri, Hindi, English", "lat": 34.0500, "lng": 74.3800, "note": "Certified J&K tourism"}
        ]
    },
    {
        "slug": "coorg",
        "name": "Coorg",
        "tagline": "Scotland of India — coffee mist & cardamom hills",
        "region": "Western Ghats",
        "state": "Karnataka",
        "best_season": "Sep – Mar",
        "budget_per_day": 1400,
        "vibe": "Coffee brown, misty green, rainforest, cardamom",
        "hero_image": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=85",
        "coords": {"lat": 12.4244, "lng": 75.7382},
        "highlights": ["Abbey Falls", "Raja's Seat sunset", "Dubare elephant camp", "Coffee plantation walk", "Talakaveri river origin"],
        "stays": [
            {"name": "Kaapi Cottage, Madikeri", "type": "Homestay", "price": 900, "note": "Inside a working coffee estate", "lat": 12.4204, "lng": 75.7397},
            {"name": "Kabbe Hills Farm Stay", "type": "Farm Stay", "price": 1200, "note": "Kodava family, home-cooked pandi curry", "lat": 12.3419, "lng": 75.7833},
            {"name": "Nisargadhama Bamboo Hut", "type": "Bamboo Hut", "price": 800, "note": "River-island, deer roam free", "lat": 12.2703, "lng": 75.9128}
        ],
        "food_spots": [
            {"name": "Coorg Cuisine, Madikeri", "dish": "Pandi curry + akki roti", "price": 250, "lat": 12.4194, "lng": 75.7300, "note": "Family recipe, no tourist menu"},
            {"name": "Anna's Bakery, KP Road", "dish": "Coorg coffee + banana chips", "price": 60, "lat": 12.4210, "lng": 75.7404, "note": "Chhoti dukaan, cash only, since 1971"},
            {"name": "Raintree Cafe, Coorg", "dish": "Kadambuttu + mushroom curry", "price": 220, "lat": 12.4180, "lng": 75.7392, "note": "Rain-forest view balcony seating"}
        ],
        "rentals": [
            {"name": "Madikeri Bike Rentals", "type": "Scooter/Bike", "vehicle": "Activa / Bullet", "price_per_day": 700, "lat": 12.4204, "lng": 75.7397, "note": "For estate hopping, DL required"},
            {"name": "Coorg Cab Union, Madikeri", "type": "Cab", "vehicle": "Innova for full-day", "price_per_day": 2800, "lat": 12.4200, "lng": 75.7400, "note": "Fixed rate, no online markup"}
        ],
        "guides": [
            {"name": "Poovaiah (Coffee Estate Walks)", "specialty": "Coffee cultivation + Kodava culture", "price_per_day": 800, "languages": "Kodava, Kannada, English", "lat": 12.4204, "lng": 75.7397, "note": "Family owns 3rd-gen estate"},
            {"name": "Dubare Elephant Trainer", "specialty": "Ethical elephant interaction + jungle walk", "price_per_day": 600, "languages": "Kannada, Hindi", "lat": 12.2703, "lng": 75.9128, "note": "Govt-affiliated mahout"}
        ]
    },
    {
        "slug": "andaman",
        "name": "Andaman",
        "tagline": "Turquoise silence — coral reefs & untouched beaches",
        "region": "Islands",
        "state": "Andaman & Nicobar",
        "best_season": "Nov – May",
        "budget_per_day": 2600,
        "vibe": "Turquoise sea, coral pink, white sand, palm green",
        "hero_image": "https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=1600&q=85",
        "coords": {"lat": 11.7401, "lng": 92.6586},
        "highlights": ["Radhanagar Beach (Havelock)", "Cellular Jail light+sound show", "Scuba diving at Elephant Beach", "Ross Island ruins", "Neil Island Bharatpur Beach"],
        "stays": [
            {"name": "Emerald Gecko, Havelock", "type": "Beach Hut", "price": 1400, "note": "Bamboo huts, walk to Radhanagar", "lat": 11.9800, "lng": 92.9631},
            {"name": "Pearl Park Beach Resort, Neil", "type": "Cottage", "price": 1600, "note": "Coconut grove, kayak rentals", "lat": 11.8322, "lng": 93.0428},
            {"name": "Blue Bird Homestay, Port Blair", "type": "Homestay", "price": 1000, "note": "Bengali fishing family, fresh catch daily", "lat": 11.6234, "lng": 92.7265}
        ],
        "food_spots": [
            {"name": "Full Moon Cafe, Havelock", "dish": "Grilled tuna + coconut rice", "price": 300, "lat": 11.9769, "lng": 92.9868, "note": "Beach shack, hammocks + reggae"},
            {"name": "Annapurna, Aberdeen Bazaar", "dish": "Fish thali + tender coconut", "price": 180, "lat": 11.6690, "lng": 92.7454, "note": "Local Bengali kitchen, no menu"},
            {"name": "Something Different Cafe, Neil", "dish": "Homemade pesto pasta + lassi", "price": 250, "lat": 11.8300, "lng": 93.0500, "note": "Israeli-Indian couple, live music Fri"}
        ],
        "rentals": [
            {"name": "Havelock Scooter Point", "type": "Scooter", "vehicle": "Activa", "price_per_day": 500, "lat": 11.9800, "lng": 92.9631, "note": "Best for jetty ↔ Radhanagar rides"},
            {"name": "Blue Water Divers, Havelock", "type": "Scuba/Snorkel gear", "vehicle": "Full snorkel kit", "price_per_day": 400, "lat": 11.9790, "lng": 92.9800, "note": "PADI certified, ethical corals"},
            {"name": "Neil Island Cycle Wala", "type": "Cycle", "vehicle": "Cycle for island loop", "price_per_day": 150, "lat": 11.8322, "lng": 93.0428, "note": "Cash only, cover whole Neil in a day"}
        ],
        "guides": [
            {"name": "Andaman Bubbles Dive Team", "specialty": "Scuba diving intro + coral safety", "price_per_day": 3500, "languages": "Hindi, English", "lat": 11.9800, "lng": 92.9631, "note": "Includes full gear + open-water intro"},
            {"name": "Ross Island Naturalist", "specialty": "British ruins + island history walk", "price_per_day": 600, "languages": "Bengali, Hindi, English", "lat": 11.6810, "lng": 92.7500, "note": "History teacher turned guide"}
        ]
    }
]

# ============ MODELS ============
class Destination(BaseModel):
    slug: str
    name: str
    tagline: str
    region: str
    state: str
    best_season: str
    budget_per_day: int
    vibe: str
    hero_image: str
    coords: dict
    highlights: List[str]
    stays: List[dict]
    food_spots: List[dict]

class TripPlanRequest(BaseModel):
    destination_slug: str
    days: int = Field(ge=1, le=14)
    budget: int = Field(ge=500)
    travel_style: str = "balanced"  # adventure, spiritual, chill, family, balanced
    preferences: Optional[str] = ""

class ChatMessage(BaseModel):
    session_id: str
    message: str
    destination_slug: Optional[str] = None

class ReviewCreate(BaseModel):
    destination_slug: str
    rating: int = Field(ge=1, le=5)
    text: str
    visited_month: Optional[str] = None

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None

# ============ AUTH HELPERS ============
async def get_current_user(
    request: Request,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
) -> User:
    token = session_token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "", 1)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user_doc)


async def optional_user(
    request: Request,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
) -> Optional[User]:
    try:
        return await get_current_user(request, session_token, authorization)
    except HTTPException:
        return None

# ============ ROUTES ============
@api_router.get("/")
async def root():
    return {"message": "Budget Yatra API is live 🏔️"}


# --- Destinations ---
@api_router.get("/destinations")
async def list_destinations(region: Optional[str] = None):
    q = {"region": region} if region else {}
    docs = await db.destinations.find(q, {"_id": 0}).to_list(100)
    return docs


@api_router.get("/destinations/{slug}")
async def get_destination(slug: str):
    doc = await db.destinations.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Destination not found")
    return doc


@api_router.get("/destinations/{slug}/reviews")
async def get_reviews(slug: str):
    docs = await db.reviews.find({"destination_slug": slug}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return docs


# --- AI Trip Planner ---
@api_router.post("/trip/plan")
async def plan_trip(req: TripPlanRequest):
    dest = await db.destinations.find_one({"slug": req.destination_slug}, {"_id": 0})
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")

    system_msg = (
        "You are Budget Yatra, an authentic Indian travel planner focused on ROOTS — "
        "hidden gems, local dhabas, small shops, homestays. NEVER recommend big commercial hotels/chains. "
        "Always return valid JSON only, no markdown, no prose outside JSON."
    )
    user_prompt = f"""Plan a {req.days}-day trip to {dest['name']}, India for a solo/small-group traveller.
Total budget: ₹{req.budget}
Style: {req.travel_style}
Extra preferences: {req.preferences or 'none'}

Known local stays: {json.dumps([s['name'] for s in dest['stays']])}
Known local food spots: {json.dumps([f['name'] + ' - ' + f['dish'] for f in dest['food_spots']])}

Return ONLY this exact JSON schema:
{{
  "title": "catchy trip title",
  "summary": "2 line vibe summary",
  "total_estimated_cost": integer_rupees,
  "days": [
    {{
      "day": 1,
      "theme": "short theme like 'Arrival & Chai'",
      "morning": "activity + local tip",
      "afternoon": "activity + local tip",
      "evening": "activity + local tip",
      "stay": "suggested stay from known list",
      "food_tip": "which food spot / dish",
      "day_cost": integer_rupees
    }}
  ],
  "packing_tips": ["3-5 short tips"],
  "local_etiquette": ["2-3 short cultural tips"]
}}"""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"plan_{uuid.uuid4().hex[:8]}",
        system_message=system_msg,
    ).with_model("gemini", "gemini-3-flash-preview")

    try:
        resp = await chat.send_message(UserMessage(text=user_prompt))
        text = resp if isinstance(resp, str) else str(resp)
        # strip possible markdown fencing
        text = text.strip()
        if text.startswith("```"):
            text = text.split("```", 2)[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip("` \n")
        plan = json.loads(text)
    except Exception as e:
        logging.exception("plan_trip failed")
        raise HTTPException(status_code=500, detail=f"AI planner failed: {e}")

    plan["destination"] = {"slug": dest["slug"], "name": dest["name"], "hero_image": dest["hero_image"]}
    plan["plan_id"] = f"plan_{uuid.uuid4().hex[:10]}"
    return plan


class SavePlan(BaseModel):
    plan: dict


@api_router.post("/trip/save")
async def save_trip(body: SavePlan, user: User = Depends(get_current_user)):
    doc = {
        "trip_id": f"trip_{uuid.uuid4().hex[:10]}",
        "user_id": user.user_id,
        "plan": body.plan,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.saved_trips.insert_one(doc)
    return {"trip_id": doc["trip_id"], "message": "Trip saved to your Yatra"}


@api_router.get("/trip/mine")
async def my_trips(user: User = Depends(get_current_user)):
    docs = await db.saved_trips.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return docs


# --- AI Chatbot (SSE stream) ---
@api_router.post("/chat/stream")
async def chat_stream(body: ChatMessage):
    dest_context = ""
    if body.destination_slug:
        dest = await db.destinations.find_one({"slug": body.destination_slug}, {"_id": 0})
        if dest:
            dest_context = f"\nCurrent destination context: {dest['name']} ({dest['tagline']}). Season: {dest['best_season']}. Vibe: {dest['vibe']}."

    system_msg = (
        "You are Yatri, a warm, friendly Indian travel companion for Budget Yatra. "
        "You speak in casual Hinglish when appropriate (mix Hindi + English naturally). "
        "Focus on authentic, budget-friendly, roots-connected travel — small dhabas, homestays, hidden gems. "
        "Never recommend big commercial chains. Keep replies concise (2-4 short paragraphs)."
        + dest_context
    )

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=body.session_id,
        system_message=system_msg,
    ).with_model("gemini", "gemini-3-flash-preview")

    # load prior history from DB and replay so context persists across requests
    prior = await db.chat_history.find({"session_id": body.session_id}, {"_id": 0}).sort("ts", 1).to_list(100)

    async def event_gen():
        try:
            # replay is not needed if LlmChat instance is fresh per request — instead
            # we build a single combined prompt with recent history for stateless replay
            history_text = ""
            for m in prior[-10:]:
                role = "User" if m["role"] == "user" else "Yatri"
                history_text += f"\n{role}: {m['text']}"
            prompt = (history_text + f"\nUser: {body.message}\nYatri:").strip()

            full = ""
            async for ev in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(ev, TextDelta):
                    full += ev.content
                    yield f"data: {json.dumps({'delta': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
            # persist
            now = datetime.now(timezone.utc).isoformat()
            await db.chat_history.insert_many([
                {"session_id": body.session_id, "role": "user", "text": body.message, "ts": now},
                {"session_id": body.session_id, "role": "assistant", "text": full, "ts": now},
            ])
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            logging.exception("chat_stream error")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api_router.get("/chat/history/{session_id}")
async def chat_history(session_id: str):
    docs = await db.chat_history.find({"session_id": session_id}, {"_id": 0}).sort("ts", 1).to_list(100)
    return docs


# --- Auth (Emergent-managed Google) ---
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    async with httpx.AsyncClient() as hx:
        r = await hx.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=15.0,
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Emergent auth exchange failed")
    data = r.json()
    email = data["email"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {
            "name": data.get("name"), "picture": data.get("picture"),
        }})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name"),
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        max_age=7 * 24 * 60 * 60, path="/",
    )
    return {"user": {"user_id": user_id, "email": email, "name": data.get("name"), "picture": data.get("picture")}}


@api_router.get("/auth/me")
async def me(user: User = Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)):
    token = session_token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "", 1)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# --- Wishlist + Reviews (auth required) ---
@api_router.post("/wishlist/{slug}")
async def toggle_wishlist(slug: str, user: User = Depends(get_current_user)):
    existing = await db.wishlist.find_one({"user_id": user.user_id, "slug": slug})
    if existing:
        await db.wishlist.delete_one({"user_id": user.user_id, "slug": slug})
        return {"added": False}
    await db.wishlist.insert_one({"user_id": user.user_id, "slug": slug, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"added": True}


@api_router.get("/wishlist")
async def get_wishlist(user: User = Depends(get_current_user)):
    docs = await db.wishlist.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    slugs = [d["slug"] for d in docs]
    if not slugs:
        return []
    dests = await db.destinations.find({"slug": {"$in": slugs}}, {"_id": 0}).to_list(100)
    return dests


@api_router.post("/reviews")
async def create_review(body: ReviewCreate, user: User = Depends(get_current_user)):
    doc = {
        "review_id": f"rev_{uuid.uuid4().hex[:10]}",
        "destination_slug": body.destination_slug,
        "user_id": user.user_id,
        "user_name": user.name,
        "user_picture": user.picture,
        "rating": body.rating,
        "text": body.text,
        "visited_month": body.visited_month,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)
    return {"review_id": doc["review_id"], "ok": True}


# --- Community Stories (long-form blog) ---
class StoryCreate(BaseModel):
    destination_slug: str
    title: str
    cover_image: Optional[str] = None
    content: str  # supports newline-separated paragraphs
    tags: Optional[List[str]] = []


@api_router.post("/stories")
async def create_story(body: StoryCreate, user: User = Depends(get_current_user)):
    if len(body.content.strip()) < 150:
        raise HTTPException(status_code=400, detail="Story must be at least 150 characters — genuine only")
    if len(body.title.strip()) < 6:
        raise HTTPException(status_code=400, detail="Title too short")
    dest = await db.destinations.find_one({"slug": body.destination_slug}, {"_id": 0})
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")

    doc = {
        "story_id": f"story_{uuid.uuid4().hex[:12]}",
        "destination_slug": body.destination_slug,
        "destination_name": dest["name"],
        "author_id": user.user_id,
        "author_name": user.name,
        "author_picture": user.picture,
        "title": body.title.strip(),
        "cover_image": body.cover_image or dest.get("hero_image"),
        "content": body.content.strip(),
        "tags": [t.strip().lower() for t in (body.tags or []) if t.strip()][:6],
        "likes": 0,
        "read_time_min": max(1, len(body.content.split()) // 200),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.stories.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/stories")
async def list_stories(destination_slug: Optional[str] = None, limit: int = 50):
    q = {"destination_slug": destination_slug} if destination_slug else {}
    docs = await db.stories.find(q, {"_id": 0}).sort("created_at", -1).to_list(limit)
    # trim content in list view
    for d in docs:
        d["excerpt"] = d["content"][:220] + ("…" if len(d["content"]) > 220 else "")
        d.pop("content", None)
    return docs


@api_router.get("/stories/{story_id}")
async def get_story(story_id: str):
    doc = await db.stories.find_one({"story_id": story_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Story not found")
    return doc


@api_router.post("/stories/{story_id}/like")
async def like_story(story_id: str, user: User = Depends(get_current_user)):
    existing = await db.story_likes.find_one({"story_id": story_id, "user_id": user.user_id})
    if existing:
        await db.story_likes.delete_one({"story_id": story_id, "user_id": user.user_id})
        await db.stories.update_one({"story_id": story_id}, {"$inc": {"likes": -1}})
        return {"liked": False}
    await db.story_likes.insert_one({"story_id": story_id, "user_id": user.user_id, "ts": datetime.now(timezone.utc).isoformat()})
    await db.stories.update_one({"story_id": story_id}, {"$inc": {"likes": 1}})
    return {"liked": True}


@api_router.get("/stories-mine")
async def my_stories(user: User = Depends(get_current_user)):
    docs = await db.stories.find({"author_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for d in docs:
        d["excerpt"] = d["content"][:220] + ("…" if len(d["content"]) > 220 else "")
        d.pop("content", None)
    return docs


# --- Seed endpoint (idempotent) ---
@api_router.post("/admin/seed")
async def seed():
    for d in DESTINATIONS_SEED:
        await db.destinations.update_one({"slug": d["slug"]}, {"$set": d}, upsert=True)
    return {"seeded": len(DESTINATIONS_SEED)}


@app.on_event("startup")
async def on_start():
    # auto-seed on boot
    for d in DESTINATIONS_SEED:
        await db.destinations.update_one({"slug": d["slug"]}, {"$set": d}, upsert=True)
    logging.getLogger(__name__).info("Seeded %d destinations", len(DESTINATIONS_SEED))


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
