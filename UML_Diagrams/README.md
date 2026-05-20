# UML Diagrams — Patient Healthcare Management System

## 📋 Deliverables Summary

All diagrams have been created as native **draw.io** (.drawio) files with proper UML notation, ready for editing and export.

### Use Case Diagrams (8 Total)

| ID | Module | File |
|----|--------|------|
| UC01 | Patient Registration & Management | `UC01_Patient_Registration_Management.drawio` |
| UC02 | Doctor & Staff Management | `UC02_Doctor_Staff_Management.drawio` |
| UC03 | Appointment Booking & Scheduling | `UC03_Appointment_Booking_Scheduling.drawio` |
| UC04 | Medical Records Management | `UC04_Medical_Records_Management.drawio` |
| UC05 | Billing & Payment Processing | `UC05_Billing_Payment_Processing.drawio` |
| UC06 | Pharmacy & Medication Management | `UC06_Pharmacy_Medication_Management.drawio` |
| UC07 | Laboratory Tests & Results | `UC07_Laboratory_Tests_Results.drawio` |
| UC08 | Patient Discharge & Reporting | `UC08_Patient_Discharge_Reporting.drawio` |

### Activity Diagram (1 Total)

| Diagram | File |
|---------|------|
| Patient Appointment Booking Flow | `Activity_Diagram_Patient_Appointment_Booking.drawio` |

---

## 🎯 Each Use Case Diagram Includes

✅ **System Boundary** — Clearly labeled rectangle enclosing all use cases  
✅ **Actors** — Patient, Doctor, Admin, Nurse, Pharmacist, Lab Technician (as applicable)  
✅ **Primary Use Cases** — Core operations for each module  
✅ **Secondary Use Cases** — Supporting operations  
✅ **«include» Relationships** — Mandatory flows (e.g., "Register includes Verify")  
✅ **«extend» Relationships** — Optional flows (e.g., "Refund extends Payment")  
✅ **Proper UML Notation** — Standard associations, labels, and conventions  

---

## 📊 Activity Diagram Features

**Patient Appointment Booking Flow** includes:

✅ **Sequential Activities** — Patient logs in → Search doctor → Check availability  
✅ **Decision Nodes** — "Slot Available?" and "Patient Insured?"  
✅ **Parallel Activities** — Notify doctor + Confirm to patient (simultaneous)  
✅ **Alternate Flows** — No slots available → Join waitlist  
✅ **Exception Handling** — Insurance verification branch  
✅ **Start/End Events** — Clear entry and exit points  

---

## 🔧 How to Use These Files

### In draw.io Editor
1. Open **draw.io** (online or desktop)
2. File → Open → Select `.drawio` file
3. Edit as needed (add/remove elements, adjust layouts)
4. **Save** to preserve changes

### Export to PNG
1. Open the diagram in draw.io
2. File → Export As → PNG
3. Select quality/size options
4. Download PNG file

### Edit Locally in VS Code
- Open `.drawio` file directly in VS Code
- Install "Draw.io Integration" extension for better preview
- Right-click → Open with Draw.io to edit

---

## 📐 UML Conventions Used

| Symbol | Meaning |
|--------|---------|
| 🟢 Oval | Use Case |
| 🕴️ Stick Figure | Actor |
| ▭ Rectangle | System Boundary |
| → | Association (Actor to Use Case) |
| ⟶⟶ dashed | Relationship (include/extend) |
| ◇ | Decision Point (Activity Diagram) |
| ▭ | Activity/Process (Activity Diagram) |

---

## 📝 Next Steps

1. **Open each diagram** in draw.io to review
2. **Customize as needed** — Add company colors, adjust labels, modify flows
3. **Export PNG versions** for documentation or presentations
4. **Share with stakeholders** for feedback and approval

---

**Created:** May 20, 2026  
**Format:** Draw.io (.drawio) — Editable vector files  
**Total Files:** 9 diagrams  
