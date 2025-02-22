# 🚀 Ticket Automation Serverless App  
_Automating Ticket Lifecycle with Freshdesk Serverless Framework_  

## 📌 Introduction  
This project is a **serverless Freshdesk app** that automates ticket creation, agent responses, and customer replies in a structured sequence. It ensures smooth simulation of customer-agent interactions with scheduled execution.  

---

## 🛠️ Tech Stack  
- **Freshdesk Serverless App Framework** (FDK 9)  
- **Freshdesk API** – Ticket creation & updates  
- **Freshdesk Scheduled Events** – Automated execution  
- **Node.js** (v18.20.3) – Backend logic  

---

## ⚙️ Configuration  
Upon installation, the user provides:  
✅ **Domain** – Freshdesk instance URL  
✅ **API Key** – Used for authentication  
✅ **Number of Tickets per Day** – Defines daily ticket creation  

---

## 🔄 Application Workflow  

### **1️⃣ Installation & Setup**  
- Registers a scheduled event for automation  
- Starts execution after **5 minutes**  

### **2️⃣ Automated Ticket Lifecycle (Every 5 Min)**  
✅ **T = 5 min** → Create a new ticket  
✅ **T = 10 min** → Add agent response  
✅ **T = 15 min** → Customer replies  
✅ **T = 20 min** → New ticket is created (cycle repeats)  

### **3️⃣ Managing Ticket Data**  
- Ticket IDs are stored & used in scheduled events  
- Updates tickets with responses in each cycle  

### **4️⃣ Daily Execution & Reset**  
- Stops after reaching the **configured ticket limit**  
- Resumes at **9:00 AM IST** the next day  

---

## ⏳ Scheduling Logic  
📌 **Recurring Event Trigger** → Every **5 minutes**  
📌 **Maintains Sequence** → Ensures proper agent & customer responses  
📌 **Daily Reset** → Execution pauses once limit is reached, resumes at **9 AM IST**  

---

## 🚨 Error & API Limit Handling  
✅ **Logs**:  
- `console.info()` – Logs all responses  
- `console.error()` – Captures errors  

✅ **API Rate Limits**:  
- Max **50 tickets/day** (Trial instance allows 50 API calls/min)  
- Retries **429 (Rate Limit) & 502 (Network)** errors with `retryDelay` & `maxAttempts`  

---

## 🎯 Conclusion  
This Freshdesk serverless app ensures a **structured, repeatable, and automated ticketing system**, efficiently managing ticket creation, agent responses, and customer interactions while optimizing API limits.  

🚀 **Ready to Automate? Let’s Go!**  
