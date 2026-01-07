from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
import motor.motor_asyncio
import qrcode
import io
import base64
from bson import ObjectId

app = FastAPI()

# 1. SETUP CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. DATABASE CONNECTION
MONGO_URL = "mongodb+srv://admin:nexus123@cluster0.1wkzhmq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.nexus_logistics
trips_db = db.trips

# 3. SECURITY KEYS
POLICE_SECRET = "POLICE_ACCESS_TOKEN_2026"

# 4. DATA MODELS (UPDATED FOR FILES ✅)
# We create a new "box" to hold the 4 document images
class TripDocuments(BaseModel):
    rc_book: Optional[str] = None
    insurance: Optional[str] = None
    puc_cert: Optional[str] = None
    permit: Optional[str] = None

class TripCreate(BaseModel):
    driver_name: str
    driver_phone: str
    vehicle_number: str
    route_from: str
    route_to: str
    # 👇 This tells Backend: "Expect a list of documents inside"
    documents: TripDocuments 

# --- API ENDPOINTS ---

@app.get("/")
def home():
    return {"message": "Nexus Logistics AI Backend is RUNNING 🚀"}

@app.post("/create_trip_qr")
async def create_trip(trip: TripCreate):
    # 1. Save Data (This now includes the Base64 images!)
    new_trip = await trips_db.insert_one(trip.dict())
    trip_id = str(new_trip.inserted_id)

    # 2. Generate QR Code (ID Only)
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(trip_id)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # 3. Convert QR to Base64
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    print(f"📲 [DATABASE] Saved Trip {trip_id} with Documents.")

    return {"qr_base64": qr_base64}

@app.post("/verify_qr")
async def verify_qr(data: dict, x_police_auth: Optional[str] = Header(None)):
    # 1. Security Check
    if x_police_auth != POLICE_SECRET:
        raise HTTPException(status_code=403, detail="ACCESS DENIED")

    # 2. Find Trip
    token = data.get("token")
    try:
        trip = await trips_db.find_one({"_id": ObjectId(token)})
    except:
        raise HTTPException(status_code=404, detail="Invalid ID")

    if not trip:
        raise HTTPException(status_code=404, detail="Trip Not Found")
    
    # 3. BUILD REAL DOCUMENT LIST (Fetching from MongoDB)
    # This logic checks: "Did the user upload an RC Book? If yes, send it to the phone."
    doc_list = []
    stored_docs = trip.get("documents", {})

    if stored_docs.get("rc_book"):
        doc_list.append({"name": "RC Book", "status": "VERIFIED", "image": stored_docs["rc_book"]})
    
    if stored_docs.get("insurance"):
        doc_list.append({"name": "Insurance", "status": "VERIFIED", "image": stored_docs["insurance"]})
        
    if stored_docs.get("puc_cert"):
        doc_list.append({"name": "Pollution Cert", "status": "VERIFIED", "image": stored_docs["puc_cert"]})
        
    if stored_docs.get("permit"):
        doc_list.append({"name": "National Permit", "status": "ACTIVE", "image": stored_docs["permit"]})

    # If no docs uploaded, show a message
    if not doc_list:
        doc_list.append({"name": "No Digital Docs", "status": "MISSING", "image": None})

    # 4. Return Data to Mobile
    return {
        "status": "APPROVED",
        "driver": trip.get("driver_name"),
        "phone": trip.get("driver_phone"),
        "vehicle": trip.get("vehicle_number"),
        "route": f"{trip.get('route_from')} ➝ {trip.get('route_to')}",
        "documents": doc_list 
    }

@app.get("/get_all_trips")
async def get_trips():
    # Only fetch last 10
    cursor = trips_db.find().sort("_id", -1).limit(10)
    trips = []
    async for document in cursor:
        document["_id"] = str(document["_id"])
        # Optimization: We remove the images here so the Vault loads fast
        if "documents" in document:
            del document["documents"] 
        trips.append(document)
    return trips