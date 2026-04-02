## Day 9 - Admin APIs

- Get all emergency requests
- Filter by status and emergency type
- Sorting and pagination
- Get single request by ID
- Response optimization (lean, select, indexing)

### Day 10 — Assign Driver + Realtime Notifications

- PATCH /api/admin/requests/:id/assign-driver
- Assign driver to emergency request
- Update status → DISPATCHED
- Update driver availability
- Socket.io real-time notifications:
  - Driver receives assignment
  - Admin dashboard updates
- Validation:
  - Only PENDING requests allowed
  - Driver must be available

 
## 🚑 Day 11 Features

- Driver APIs implemented
- Status flow: DISPATCHED → COMPLETED
- Idempotent updates (retry-safe)
- Geo-based driver assignment
- Real-time socket integration
=======

## 🚑 Driver APIs (Day 11)

### 📌 Features Implemented

- Fetch assigned emergency requests for driver
- Update request status by driver
- Ensure only assigned driver can update request
- Secure APIs using JWT authentication and role-based access control

---

### 📍 API Endpoints

#### 1. Get Assigned Requests
#### 2. Get Active Assigned Request

---

#### 3. Update Request Status

---

### 🔐 Headers

---

### 📦 Example Request (Update Status)

```json
{
  "status": "ENROUTE"
}
PENDING → DISPATCHED → ENROUTE → ARRIVED → PICKED_UP → COMPLETED



  ## 🚑 Driver Live Location Tracking (Day 12)

### 📌 Features Implemented

- Real-time driver location tracking
- GeoJSON-based location storage using MongoDB
- Secure API with JWT authentication and role-based access control
- Input validation using middleware
- Real-time updates using Socket.IO

---

### 📍 API Endpoint

**Update Driver Location**
PATCH /api/driver/me/location

---

### 🔐 Headers
Authorization: Bearer <DRIVER_TOKEN>
Content-Type: application/json


---

### 📦 Request Body

```json
{
  "coordinates": [longitude, latitude]
}

