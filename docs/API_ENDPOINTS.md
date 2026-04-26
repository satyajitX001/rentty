# RentOk API Endpoints (Draft Contract)

Base URL: `/api/v1`

Authentication uses `Authorization: Bearer <token>` for protected routes.

## 1) Auth

### POST `/auth/login`
Request body:
```json
{
  "phone": "+91-9000011111",
  "password": "caretaker@123"
}
```
Response:
```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "usr-001",
    "name": "Anita Sharma",
    "role": "owner"
  }
}
```

## 2) Dashboard

### GET `/dashboard/summary`
Response:
```json
{
  "success": true,
  "data": {
    "totalProperties": 2,
    "occupiedBeds": 149,
    "totalBeds": 168,
    "activeTenants": 3,
    "pendingDues": 14100,
    "monthCollection": 22900,
    "openMaintenance": 2,
    "monthExpenses": 52000
  }
}
```

## 3) Property Management

### GET `/properties`
Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "prop-001",
      "name": "Shanti Girls Hostel",
      "address": "HSR Layout, Bengaluru",
      "totalBeds": 72,
      "occupiedBeds": 64,
      "caretaker": "Anita Sharma",
      "active": true
    }
  ]
}
```

### POST `/properties`
Request body:
```json
{
  "name": "LakeView PG",
  "address": "Bellandur, Bengaluru",
  "totalBeds": 45,
  "caretaker": "Priya Nair"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "id": "prop-003",
    "name": "LakeView PG",
    "address": "Bellandur, Bengaluru",
    "totalBeds": 45,
    "occupiedBeds": 0,
    "caretaker": "Priya Nair",
    "active": true
  }
}
```

## 4) Tenant Management

### GET `/tenants`
Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "ten-002",
      "fullName": "Neha Kulkarni",
      "propertyId": "prop-001",
      "roomNumber": "G-118",
      "monthlyRent": 9800,
      "dueAmount": 9800,
      "status": "active",
      "kycVerified": true
    }
  ]
}
```

### POST `/tenants`
Request body:
```json
{
  "fullName": "Sanya Rao",
  "phone": "+91-9000055555",
  "email": "sanya@example.com",
  "propertyId": "prop-002",
  "roomNumber": "B-208",
  "leaseStart": "2026-05-01",
  "leaseEnd": "2027-04-30",
  "monthlyRent": 8900,
  "kycVerified": false
}
```
Response:
```json
{
  "success": true,
  "data": {
    "id": "ten-010",
    "fullName": "Sanya Rao",
    "dueAmount": 8900,
    "status": "active"
  }
}
```

### PATCH `/tenants/:tenantId/lease`
Request body:
```json
{
  "leaseEnd": "2027-06-30",
  "monthlyRent": 9300,
  "remarks": "Renewed for 14 months"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "tenantId": "ten-001",
    "leaseEnd": "2027-06-30",
    "monthlyRent": 9300,
    "updatedAt": "2026-04-26"
  }
}
```

## 5) Rent Collection

### POST `/collections/collect`
Request body:
```json
{
  "tenantId": "ten-002",
  "amount": 9800,
  "mode": "UPI",
  "paidOn": "2026-04-26",
  "notes": "Paid after reminder"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay-010",
      "tenantId": "ten-002",
      "amount": 9800,
      "mode": "UPI",
      "utr": "UTR501992"
    },
    "receipt": {
      "receiptNo": "REC-1745606222",
      "balanceDue": 0
    }
  }
}
```

### GET `/collections/payments?month=2026-04`
Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "pay-001",
      "tenantId": "ten-001",
      "amount": 9500,
      "dueMonth": "2026-04",
      "paidOn": "2026-04-05",
      "mode": "UPI",
      "utr": "UTR308771"
    }
  ]
}
```

### POST `/collections/reminders`
Request body:
```json
{
  "tenantIds": ["ten-002", "ten-003"],
  "channel": "whatsapp",
  "message": "Rent due reminder"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "queued": 2,
    "sentAt": "2026-04-26T08:30:00Z"
  }
}
```

## 6) Maintenance Management

### GET `/maintenance/requests`
Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "mnt-001",
      "roomNumber": "G-118",
      "title": "Bathroom tap leakage",
      "priority": "medium",
      "status": "open"
    }
  ]
}
```

### POST `/maintenance/requests`
Request body:
```json
{
  "propertyId": "prop-002",
  "tenantId": "ten-003",
  "roomNumber": "B-206",
  "title": "Wi-Fi not working",
  "description": "No internet since last night",
  "priority": "high"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "id": "mnt-010",
    "status": "open",
    "requestedOn": "2026-04-26"
  }
}
```

### PATCH `/maintenance/requests/:requestId/status`
Request body:
```json
{
  "status": "resolved",
  "serviceProvider": "SkyNet Internet Support",
  "actualCost": 1000
}
```
Response:
```json
{
  "success": true,
  "data": {
    "requestId": "mnt-002",
    "status": "resolved",
    "updatedOn": "2026-04-26"
  }
}
```

## 7) Expense & Finance

### GET `/expenses?month=2026-04`
Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "exp-001",
      "category": "Electricity",
      "amount": 38200,
      "paidBy": "Anita Sharma",
      "paidTo": "BESCOM",
      "spentOn": "2026-04-09"
    }
  ]
}
```

### POST `/expenses`
Request body:
```json
{
  "propertyId": "prop-002",
  "category": "Repair",
  "amount": 4600,
  "paidBy": "Rahul Verma",
  "paidTo": "Metro Maintenance Co",
  "spentOn": "2026-04-17",
  "remarks": "Water motor repair"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "id": "exp-010",
    "createdAt": "2026-04-26"
  }
}
```

### GET `/finance/reports/pnl?from=2026-04-01&to=2026-04-30`
Response:
```json
{
  "success": true,
  "data": {
    "totalCollection": 22900,
    "totalExpense": 52000,
    "net": -29100
  }
}
```

## 8) Documents

### GET `/documents?entityType=tenant&entityId=ten-001`
Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-001",
      "title": "Aarohi Lease Agreement",
      "fileType": "pdf",
      "uploadedOn": "2025-07-01",
      "tags": ["lease", "kyc"]
    }
  ]
}
```

### POST `/documents/upload`
Request body (`multipart/form-data`):
- `file`
- `entityType`
- `entityId`
- `tags[]`

Response:
```json
{
  "success": true,
  "data": {
    "id": "doc-010",
    "url": "https://cdn.rentok.com/doc-010.pdf"
  }
}
```

## 9) Reports / Exports

### POST `/reports/generate`
Request body:
```json
{
  "reportType": "dues",
  "from": "2026-04-01",
  "to": "2026-04-30",
  "format": "xlsx"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "reportId": "rep-dues-2026-04",
    "fileName": "dues-report-2026-04.xlsx",
    "downloadUrl": "https://cdn.rentok.com/reports/dues-report-2026-04.xlsx"
  }
}
```

## 10) Notifications & Reminders

### GET `/notifications`
Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "alr-001",
      "title": "Rent Due Reminder",
      "type": "payment",
      "date": "2026-04-26"
    }
  ]
}
```

### POST `/notifications/schedule`
Request body:
```json
{
  "type": "lease_renewal",
  "tenantId": "ten-004",
  "notifyOn": "2026-04-28",
  "channels": ["push", "whatsapp"]
}
```
Response:
```json
{
  "success": true,
  "data": {
    "scheduleId": "sch-011",
    "status": "active"
  }
}
```

## 11) Support

### POST `/support/tickets`
Request body:
```json
{
  "subject": "Need GST breakup in expense export",
  "description": "Please show CGST/SGST columns in Excel report",
  "priority": "medium"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "ticketId": "sup-009",
    "status": "open"
  }
}
```

### GET `/support/tickets`
Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "sup-001",
      "subject": "Need GST breakup in expense export",
      "priority": "medium",
      "status": "open"
    }
  ]
}
```
