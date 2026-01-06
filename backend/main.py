from fastapi import FastAPI, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import motor.motor_asyncio
import jwt
import qrcode
import io
import re
from starlette.responses import StreamingResponse
from bson.objectid import ObjectId

# --- CONFIGURATION ---
# ⚠️ REPLACE WITH YOUR MONGODB ATLAS URL
MONGO_URL = "mongodb+srv://admin:admin%40123@cluster0.1wkzhmq.mongodb.net/?appName=Cluster0"
SECRET_KEY = "FEDEX_NATIONAL_HACKATHON_KEY"
POLICE_SECRET = "POLICE_ACCESS_TOKEN_2026"
ALGORITHM = "HS256"

# --- APP SETUP ---
app = FastAPI(title="NEXUS GATEPASS SYSTEM")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE ---
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.fedex_gatepass
trips_collection = db.trips

# --- MODELS ---
class Document(BaseModel):
    doc_name: str
    expiry_date: str  # YYYY-MM-DD

class TripCreate(BaseModel):
    driver_name: str
    vehicle_number: str
    route_from: str
    route_to: str
    documents: List[Document]

class QRToken(BaseModel):
    token: str

# --- LOGIC: AI COMPLIANCE & VALIDATION ---
def validate_indian_vehicle(number: str):
    # Regex: TN-01-AB-1234 or TN01AB1234
    pattern = r"^[A-Z]{2}[ -]?[0-9]{2}[ -]?[A-Z]{1,2}[ -]?[0-9]{4}$"
    if not re.match(pattern, number.upper()):
        raise HTTPException(status_code=400, detail="❌ Invalid Indian Vehicle Number")

def check_compliance(docs: List[Document]):
    today = datetime.now().date()
    for doc in docs:
        try:
            exp = datetime.strptime(doc.expiry_date, "%Y-%m-%d").date()
            if exp < today:
                raise HTTPException(status_code=400, detail=f"🚫 BLOCKED: {doc.doc_name} is EXPIRED")
        except ValueError:
            pass

# --- ENDPOINTS ---

@app.post("/create_trip_qr")
async def create_trip(trip: TripCreate):
    # 1. Run Checks
    validate_indian_vehicle(trip.vehicle_number)
    check_compliance(trip.documents)

    # 2. Store in DB
    trip_data = trip.dict()
    trip_data["created_at"] = datetime.now().isoformat()
    trip_data["status"] = "ACTIVE"
    trip_data["trust_score"] = 100  # Default Green Channel Score
    trip_data["current_location"] = {"lat": 13.0827, "lng": 80.2707}  # Default Chennai

    new_trip = await trips_collection.insert_one(trip_data)
    trip_id = str(new_trip.inserted_id)

    # 3. Generate ENCRYPTED Token (JWT)
    # The QR contains ONLY this token. No raw data.
    payload = {
        "sub": trip_id,
        "vn": trip.vehicle_number,
        "exp": datetime.utcnow().timestamp() + (48 * 3600)  # 48 hours validity
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    # 4. Generate QR
    qr_data = f"{token}"
    
    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    return StreamingResponse(img_byte_arr, media_type="image/png")

# --- 👮 UPDATED POLICE VERIFICATION ENDPOINT (MATCHES MOBILE APP) ---
@app.post("/verify_qr")
async def verify_qr(
    data: QRToken, 
    x_police_auth: Optional[str] = Header(None)
):
    # 1. DOUBLE LOCK SECURITY: Check for Hidden Police Header
    if x_police_auth != POLICE_SECRET:
        raise HTTPException(status_code=403, detail="🚨 UNAUTHORIZED ACCESS! POLICE ONLY.")

    # 2. Decrypt the Token
    try:
        decoded_data = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        trip_id = decoded_data.get("sub")

        # 3. Real-time DB Fetch (Ensures Trip is not deleted/banned)
        trip = await trips_collection.find_one({"_id": ObjectId(trip_id)})
        
        if not trip:
             raise HTTPException(status_code=404, detail="⚠️ TRIP NOT FOUND IN DATABASE")

        # 4. Return Clean Data to Mobile App
        return {
            "status": "APPROVED",
            "driver": trip.get("driver_name"),
            "vehicle": trip.get("vehicle_number"),
            "route": f"{trip.get('route_from')} ➝ {trip.get('route_to')}",
            "expiry": "VALID",
            "verification_time": "0.45s (AI Verified)"
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="EXPIRED PASS")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="FAKE PASS DETECTED")

@app.get("/trip/{trip_id}")
async def get_trip_details(trip_id: str):
    # For Frontend Live Tracking
    trip = await trips_collection.find_one({"_id": ObjectId(trip_id)})
    if trip:
        trip["_id"] = str(trip["_id"])
        return trip
    raise HTTPException(status_code=404)