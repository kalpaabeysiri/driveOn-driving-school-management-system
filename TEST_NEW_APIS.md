# Testing New Staff Management & Notification APIs

## Base URL
```
http://192.168.8.152:5000
```

## 1. Test Staff Management

### 1.1 Create a Staff Member (Admin Login Required)
```bash
# First login as admin
curl -X POST http://192.168.8.152:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Copy the token from response, then create staff
curl -X POST http://192.168.8.152:5000/api/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "fullName": "John Smith",
    "NIC": "123456789V",
    "dateOfBirth": "1990-01-15",
    "address": "123 Main Street",
    "city": "Colombo",
    "gender": "Male",
    "email": "john.smith@company.com",
    "password": "staff123",
    "contactNumber": "0771234567",
    "emergencyContact": "0777654321",
    "department": "Administration",
    "position": "Office Manager",
    "employmentType": "Permanent",
    "salary": 75000,
    "workSchedule": "Full Day",
    "permissions": ["manage_students", "view_reports", "send_notifications"]
  }'
```

### 1.2 Staff Login
```bash
curl -X POST http://192.168.8.152:5000/api/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.smith@company.com",
    "password": "staff123"
  }'
```

### 1.3 Get All Staff Members
```bash
curl -X GET http://192.168.8.152:5000/api/staff \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 1.4 Get Staff by ID
```bash
curl -X GET http://192.168.8.152:5000/api/staff/STAFF_ID_HERE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 2. Test Staff Attendance

### 2.1 Mark Staff Attendance
```bash
curl -X POST http://192.168.8.152:5000/api/staff/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "staffId": "STAFF_ID_HERE",
    "date": "2024-01-15",
    "checkIn": "2024-01-15T09:00:00",
    "checkOut": "2024-01-15T17:30:00",
    "status": "Present",
    "remarks": "Good performance today",
    "performanceMetrics": {
      "tasksCompleted": 8,
      "efficiency": 95,
      "customerRating": 4.5
    }
  }'
```

### 2.2 Get Staff Attendance Records
```bash
curl -X GET "http://192.168.8.152:5000/api/staff/attendance?month=1&year=2024" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 2.3 Get Staff Performance Report
```bash
curl -X GET "http://192.168.8.152:5000/api/staff/performance?month=1&year=2024" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 3. Test Notifications

### 3.1 Send Notification to All Students
```bash
curl -X POST http://192.168.8.152:5000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "message": "Theory exams will start next week. Please prepare accordingly.",
    "type": "ExamScheduled",
    "priority": "High",
    "broadcastTo": "AllStudents",
    "actionUrl": "/exam-schedule",
    "expiresAt": "2024-02-01T00:00:00.000Z"
  }'
```

### 3.2 Send Notification to Specific Student
```bash
curl -X POST http://192.168.8.152:5000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "message": "Your payment is due for this month",
    "type": "PaymentReminder",
    "priority": "Normal",
    "recipients": [
      { "student": "STUDENT_ID_HERE" }
    ],
    "actionUrl": "/payments"
  }'
```

### 3.3 Send Broadcast to All Users
```bash
curl -X POST http://192.168.8.152:5000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "message": "System maintenance scheduled for tonight 10PM-11PM",
    "type": "SystemUpdate",
    "priority": "Normal",
    "broadcastTo": "AllUsers"
  }'
```

### 3.4 Get Notifications (as logged-in user)
```bash
# First login as a student to get token
curl -X POST http://192.168.8.152:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "student123"
  }'

# Then get notifications
curl -X GET http://192.168.8.152:5000/api/notifications \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

### 3.5 Mark Notification as Read
```bash
curl -X PATCH http://192.168.8.152:5000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer USER_TOKEN"
```

### 3.6 Get Notification Statistics (Admin Only)
```bash
curl -X GET http://192.168.8.152:5000/api/notifications/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Postman Collection

You can import this collection into Postman:

```json
{
  "info": {
    "name": "DriveOn Staff Management APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://192.168.8.152:5000"
    },
    {
      "key": "adminToken",
      "value": ""
    },
    {
      "key": "staffToken",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Admin Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@example.com\",\n  \"password\": \"admin123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "login"]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.collectionVariables.set('adminToken', response.token);",
                  "}"
                ]
              }
            }
          ]
        },
        {
          "name": "Staff Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"john.smith@company.com\",\n  \"password\": \"staff123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/staff/login",
              "host": ["{{baseUrl}}"],
              "path": ["api", "staff", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Staff Management",
      "item": [
        {
          "name": "Create Staff",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{adminToken}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"fullName\": \"John Smith\",\n  \"NIC\": \"123456789V\",\n  \"dateOfBirth\": \"1990-01-15\",\n  \"address\": \"123 Main Street\",\n  \"city\": \"Colombo\",\n  \"gender\": \"Male\",\n  \"email\": \"john.smith@company.com\",\n  \"password\": \"staff123\",\n  \"contactNumber\": \"0771234567\",\n  \"emergencyContact\": \"0777654321\",\n  \"department\": \"Administration\",\n  \"position\": \"Office Manager\",\n  \"employmentType\": \"Permanent\",\n  \"salary\": 75000,\n  \"workSchedule\": \"Full Day\",\n  \"permissions\": [\"manage_students\", \"view_reports\"]\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/staff",
              "host": ["{{baseUrl}}"],
              "path": ["api", "staff"]
            }
          }
        },
        {
          "name": "Get All Staff",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{adminToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/api/staff",
              "host": ["{{baseUrl}}"],
              "path": ["api", "staff"]
            }
          }
        }
      ]
    },
    {
      "name": "Notifications",
      "item": [
        {
          "name": "Send to All Students",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{adminToken}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"message\": \"Theory exams will start next week\",\n  \"type\": \"ExamScheduled\",\n  \"priority\": \"High\",\n  \"broadcastTo\": \"AllStudents\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/notifications",
              "host": ["{{baseUrl}}"],
              "path": ["api", "notifications"]
            }
          }
        }
      ]
    }
  ]
}
```

## Testing Checklist

- [ ] Admin can create staff members
- [ ] Staff can login with their credentials
- [ ] Staff attendance can be marked
- [ ] Performance reports generate correctly
- [ ] Notifications can be sent to students
- [ ] Students receive notifications
- [ ] Notifications can be marked as read
- [ ] Permission-based access works correctly

## Common Issues & Solutions

1. **401 Unauthorized**: Make sure you're using the correct token
2. **403 Forbidden**: Check if the user has required permissions
3. **404 Not Found**: Verify the endpoint URL is correct
4. **500 Server Error**: Check the backend console for error details
