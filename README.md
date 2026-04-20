1. Problem Statement
When citizens face public issues — a broken road, a pending water connection, or an unresolved complaint — they have no reliable way to hold the responsible government officer accountable. Complaints submitted through traditional portals are stored in centralized databases that can be edited, deleted, or simply ignored without any permanent record.

The core problems are:
•	No transparency: Citizens cannot see who is handling their complaint or what action was taken.
•	No accountability: Officers can change or delete records without leaving any trace.
•	Missed deadlines: There is no mechanism to flag or enforce complaint resolution timelines.
•	No trust: Citizens lose confidence in the system because there is no verifiable proof of actions taken.

This project proposes a Web3-enabled blockchain solution where every complaint and every action is recorded permanently on a local Ethereum blockchain using smart contracts. The Web3.js library acts as the bridge connecting the web application to the blockchain — making the system decentralized, tamper-proof, and transparent.

2. Objectives
2.1  Blockchain & Web3 Objectives
•	Use Web3.js to connect the React frontend directly to the local Ethereum blockchain (Ganache).
•	Use Web3.js on the Node.js backend to programmatically submit and read blockchain transactions.
•	Write a Solidity smart contract (Grievance.sol) that permanently stores all grievance data on-chain.
•	Use MetaMask wallet to authenticate officer and admin identities when signing blockchain transactions.
•	Demonstrate a real Web3 dApp (decentralized application) workflow: User Action → Web3.js → Smart Contract → Blockchain.

2.2  Application Objectives
•	Allow citizens to submit grievances through a simple web form — stored immutably on the blockchain.
•	Allow officers to update grievance status (Pending → In Progress → Resolved) with each update recorded on-chain.
•	Let admin or auditor view the complete history of all grievances stored on the blockchain.
•	Keep everything running on localhost — no cloud, no paid services, no complex setup.

  Web3 Objective in one line: Use Web3.js as the bridge so that the web app can read from and write to the Ethereum blockchain — making this a true decentralized application (dApp).

3. Stakeholders
Stakeholder	Role & How They Interact with Web3
Citizen	Submits a grievance via the web form. Data is sent to the blockchain via Web3.js.
Govt Officer	Logs in with MetaMask, views assigned cases, updates status — transaction signed via Web3.js.
Admin / Auditor	Views all grievances and their complete on-chain history. Read-only access via Web3.js calls.

4. System Architecture Diagram
The architecture has four layers. The highlighted Web3 layer is the most important — it is what makes this a Web3 project:

•	Frontend (React.js): Three pages — Citizen, Officer, Admin. Calls Web3.js functions to interact with the blockchain. Runs on localhost:3000.
•	Web3 Layer (Web3.js + MetaMask): The bridge between your React app and the Ganache blockchain. Web3.js converts function calls into blockchain transactions. MetaMask signs them.
•	Backend (Node.js + Express): Handles user login and uses Web3.js server-side to read/write the smart contract. Runs on localhost:5000.
•	Blockchain (Ganache + Solidity): The local Ethereum blockchain. The Grievance.sol smart contract stores all data permanently. Runs on localhost:8545.

 
Figure 1: CivicChain Architecture — Web3.js is the bridge between the App and Blockchain

5. Use Case Diagram
The diagram shows what each user does. Every action that writes data goes through Web3.js to the blockchain:
•	Citizen: Submits grievance (Web3.js sends a transaction to Grievance.sol), tracks status (Web3.js reads from blockchain).
•	Officer: Signs in via MetaMask, updates grievance status on-chain via Web3.js, closes resolved cases.
•	Admin / Auditor: Reads complete grievance history from blockchain via Web3.js — no write access.

 
Figure 2: CivicChain Use Case Diagram

6. Technology Stack
Web3.js and MetaMask are the core Web3 technologies. All other tools support them:

Tool	Category	Role in This Project
Web3.js	Web3 / Blockchain	THE core Web3 library. Connects React frontend and Node.js backend to the Ganache blockchain. Used to call smart contract functions, send transactions, and read on-chain data.
MetaMask	Web3 / Wallet	Browser wallet extension. Officers and admin use it to sign blockchain transactions — this is the standard Web3 authentication method (no username/password).
Solidity	Smart Contract	Language to write Grievance.sol — the smart contract that stores all grievance records permanently on the blockchain.
Ganache	Blockchain	One-click local Ethereum blockchain. Provides test accounts with ETH. Has a GUI to see all transactions. Runs on localhost:8545.
Truffle	Dev Tool	Compiles Grievance.sol and deploys it to Ganache with simple commands (truffle compile, truffle migrate).
React.js	Frontend	Builds the Citizen, Officer, and Admin pages. Uses Web3.js to call smart contract functions directly from the browser.
Node.js + Express	Backend	REST API server. Uses Web3.js (server-side) to interact with the smart contract for backend-triggered operations.
MongoDB (local)	Database	Stores only off-chain data like user login credentials. All grievance data lives on the blockchain, not here.

  Web3.js is used in TWO places: (1) In React.js — so the browser can call the smart contract directly. (2) In Node.js — so the backend server can also read/write the blockchain programmatically.

Note: All tools are free and run locally. Ganache has a desktop GUI (Ganache UI) making it beginner-friendly. MetaMask is a free Chrome/Firefox extension.



STEP 1 — Complete Folder & File Structure
civicchain/
│
├── blockchain/                          # Truffle project (Smart Contract)
│   ├── contracts/
│   │   └── Grievance.sol                # Main smart contract
│   ├── migrations/
│   │   ├── 1_initial_migration.js       # Truffle default migration
│   │   └── 2_deploy_grievance.js        # Deploy Grievance.sol to Ganache
│   ├── build/                           # Auto-generated after `truffle compile`
│   │   └── contracts/
│   │       └── Grievance.json           # ABI + bytecode (auto-generated)
│   └── truffle-config.js                # Truffle config (points to Ganache)
│
├── backend/                             # Node.js + Express API server
│   ├── config/
│   │   └── web3.js                      # Web3.js setup + contract ABI loader
│   ├── models/
│   │   └── User.js                      # Mongoose schema (Citizen/Officer/Admin)
│   ├── routes/
│   │   ├── auth.js                      # Register & login routes
│   │   └── grievance.js                 # CRUD routes using Web3.js
│   ├── .env                             # MongoDB URI, PORT, JWT_SECRET
│   ├── package.json                     # Backend dependencies
│   └── server.js                        # Express app entry point
│
├── frontend/                            # React.js app
│   ├── public/
│   │   └── index.html                   # HTML shell (standard CRA)
│   ├── src/
│   │   ├── utils/
│   │   │   └── web3.js                  # MetaMask connect + Web3.js helper
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx            # Login form (Citizen / Officer / Admin)
│   │   │   ├── CitizenPage.jsx          # Submit grievance + track status
│   │   │   ├── OfficerPage.jsx          # View assigned + update status
│   │   │   └── AdminPage.jsx            # View all grievances (read-only)
│   │   ├── App.jsx                      # Routes (React Router)
│   │   └── index.js                     # React DOM entry point
│   └── package.json                     # Frontend dependencies
│
└── README.md                            # Quick reference (generated in Step 5)


Key Notes on the Structure
blockchain/ is a self-contained Truffle project. You run all truffle commands from inside this folder.
backend/config/web3.js will load the ABI from blockchain/build/contracts/Grievance.json — so you must compile the contract before starting the backend.
frontend/src/utils/web3.js handles MetaMask connection in the browser and returns a Web3.js instance for direct contract calls from React.
MongoDB only stores user accounts (User.js). All grievance data lives on-chain.
The .env file keeps sensitive config out of source code.

Quick Summary of All Backend Files
FileWhat it doespackage.jsonLists all npm dependencies.envStores config (MongoDB URI, port, JWT secret, Ganache URL)server.jsStarts Express, connects MongoDB, registers routesconfig/web3.jsConnects Web3.js to Ganache, loads ABI, creates contract instancemodels/User.jsMongoDB schema for users — hashes passwords automaticallyroutes/auth.jsRegister, login, get current user, list officersroutes/grievance.jsAll blockchain read/write operations via Web3.js

Summary of All Frontend Files
FilePurposepackage.jsonReact dependencies including Web3.js and React Routerpublic/index.htmlHTML shell with <div id="root">src/index.jsMounts React app into the DOMsrc/utils/web3.jsMetaMask connect + ABI + contract instance — paste your ABI and address heresrc/App.jsxRouting + role-based protected routessrc/pages/LoginPage.jsxLogin + register with role selectionsrc/pages/CitizenPage.jsxSubmit grievance + track status by IDsrc/pages/OfficerPage.jsxView assigned grievances + update status via MetaMasksrc/pages/AdminPage.jsxView all grievances + filter by status + live stats

STEP 5 — Complete Setup Guide
A numbered, beginner-friendly guide to get CivicChain running from zero.

📋 PART 1 — Software to Install
Install these in order. All are free.
1.1 — Node.js

Go to https://nodejs.org
Download the LTS version (e.g. 18.x or 20.x)
Run the installer — keep all defaults
Verify installation:

bashnode --version    # Should print v18.x.x or higher
npm --version     # Should print 9.x.x or higher
1.2 — MongoDB Community Server

Go to https://www.mongodb.com/try/download/community
Select: Version → Latest, Platform → Windows/Mac, Package → MSI/dmg
Install with default settings
MongoDB runs as a background service automatically after install
Optionally install MongoDB Compass (GUI) from the same page — useful for seeing your users table

1.3 — Ganache GUI (Desktop App)

Go to https://trufflesuite.com/ganache/
Download for your OS and install
This is your local Ethereum blockchain — it gives you 10 fake accounts each pre-loaded with 100 ETH for testing

1.4 — Truffle (install via npm globally)
bashnpm install -g truffle
Verify:
bashtruffle version
# Should print: Truffle v5.x.x, Solidity v0.x.x, Node vX.x.x
1.5 — MetaMask Browser Extension

Go to https://metamask.io
Click "Download" → Install for Chrome or Firefox
Open MetaMask, click "Create a new wallet"
Set a password and save your Secret Recovery Phrase somewhere safe (even though this is just for local testing)
MetaMask is now installed as a browser extension — you will see its fox icon in the top-right of your browser


📋 PART 2 — Install All npm Dependencies
You need to install packages for two separate projects: the backend and the frontend.
2.1 — Backend dependencies
bash# Navigate into the backend folder
cd civicchain/backend

# Install all packages listed in backend/package.json
npm install
You should see a node_modules/ folder appear inside backend/. This installs: express, mongoose, web3, bcryptjs, jsonwebtoken, cors, dotenv, nodemon.
2.2 — Frontend dependencies
bash# Open a NEW terminal tab/window, navigate to the frontend folder
cd civicchain/frontend

# Install all packages listed in frontend/package.json
npm install
This installs: react, react-dom, react-router-dom, react-scripts, web3.

⚠️ Web3.js install note: If you see warnings about bigint or crypto during npm install in the frontend, that is normal. If the install fails with a hard error, run this instead:
bashnpm install --legacy-peer-deps

2.3 — Truffle project (no install needed)
The blockchain/ folder uses Truffle globally — no npm install needed there.

📋 PART 3 — Start and Configure Ganache
3.1 — Launch Ganache

Open the Ganache desktop app
Click "Quickstart" (the Ethereum option)

3.2 — What you will see
Ganache opens and shows:

10 accounts, each with 100 ETH — these are fake test accounts
RPC Server: HTTP://127.0.0.1:7545 — this is the blockchain URL your app will connect to
Network ID: 1337 (default)
Mnemonic: 12-word phrase shown at the top — you will use this in MetaMask

3.3 — Confirm the port
Look at the top of the Ganache window. Confirm it says port 7545.
If it says 8545 instead, open blockchain/truffle-config.js and change:
javascriptport: 7545,   // change this to 8545 if your Ganache shows 8545

✅ Leave Ganache running. Do not close it — it must stay open the entire time you are developing.


📋 PART 4 — Compile and Deploy the Smart Contract
4.1 — Navigate to the blockchain folder
bashcd civicchain/blockchain
4.2 — Compile the smart contract
bashtruffle compile
What happens: Truffle reads contracts/Grievance.sol, compiles it, and creates build/contracts/Grievance.json. This JSON file contains the ABI and bytecode needed by Web3.js.
Expected output:
Compiling your contracts...
===========================
> Compiling ./contracts/Grievance.sol
> Artifacts written to /path/to/civicchain/blockchain/build/contracts
> Compiled successfully using:
   - solc: 0.8.0
If you see errors here, double-check pragma solidity ^0.8.0; is at the top of Grievance.sol.
4.3 — Deploy (migrate) to Ganache
bashtruffle migrate
Expected output:
Starting migrations...
======================
> Network name:    'development'
> Network id:      1337
> Block gas limit: 6721975

2_deploy_grievance.js
=====================
   Deploying 'Grievance'
   ----------------------
   > transaction hash:    0xabc123...
   > contract address:    0xDef456...   ← COPY THIS ADDRESS
   > block number:        1
   > gas used:            849031

> Saving migration to chain.
> Saving artifacts...
4.4 — Copy the contract address
Copy the value next to contract address: — for example 0xDef456...
You will paste it into:

frontend/src/utils/web3.js → replace "PASTE_YOUR_CONTRACT_ADDRESS_HERE"


⚠️ Every time you restart Ganache and re-run truffle migrate, the contract gets a NEW address. You must update frontend/src/utils/web3.js with the new address each time.


To avoid re-deployment when you just restart: use truffle migrate --reset only when you change the contract code. If Ganache is still running from before, the old address still works.


📋 PART 5 — Copy the Contract ABI Into the Frontend
The ABI written in frontend/src/utils/web3.js matches the contract exactly — so it should work as-is.
However, if you ever modify Grievance.sol, you must update the ABI too. Here is how:
5.1 — Open the generated JSON file
civicchain/blockchain/build/contracts/Grievance.json
5.2 — Find the "abi" field
It looks like:
json{
  "contractName": "Grievance",
  "abi": [
    { ... },
    { ... }
  ],
  ...
}
5.3 — Copy the entire array
Select everything from the opening [ to the closing ] of the "abi" field.
5.4 — Paste it into the frontend
Open frontend/src/utils/web3.js and replace the entire CONTRACT_ABI = [ ... ] array with what you copied.

📋 PART 6 — Connect MetaMask to Ganache
This is the most important step for the Officer and Admin roles to work.
6.1 — Open MetaMask in your browser
Click the fox icon in the top-right of your browser.
6.2 — Add Ganache as a custom network

Click the network dropdown at the top (it probably says "Ethereum Mainnet")
Click "Add network"
Click "Add a network manually"
Fill in these exact details:

FieldValueNetwork NameGanache LocalNew RPC URLhttp://127.0.0.1:7545Chain ID1337Currency SymbolETH

Click Save
Select "Ganache Local" from the network dropdown — MetaMask should now show it

6.3 — Import a Ganache test account into MetaMask
You need to use one of Ganache's pre-funded accounts as your officer/admin wallet.
Method A — Import via Mnemonic (imports all 10 accounts):

In MetaMask → click your account icon (top right) → "Import wallet" or "Add account or hardware wallet"
Choose "Import account" and then select Secret Recovery Phrase
Paste the 12-word mnemonic shown at the top of the Ganache window
MetaMask will import all 10 Ganache accounts

Method B — Import via private key (imports one account):

In Ganache, click the key icon 🔑 next to any account
Copy the private key shown
In MetaMask → click your account icon → "Import account"
Select "Private Key", paste it, click Import

6.4 — Copy the wallet address
After importing, MetaMask shows the account address (e.g. 0xAbCd...).
Copy this — you will use it when registering an Officer or Admin account in CivicChain.

✅ Ganache accounts have 100 ETH each. Every blockchain transaction (submit grievance, update status) costs a tiny amount of this fake ETH as "gas". This is completely normal.


📋 PART 7 — Start the Backend
7.1 — Make sure MongoDB is running
MongoDB should already be running as a background service after installation. To verify:
bash# On Windows (in PowerShell as Admin):
Get-Service -Name MongoDB

# On Mac/Linux:
brew services list | grep mongodb
# or
sudo systemctl status mongod
If it is not running:
bash# Mac (with Homebrew):
brew services start mongodb-community

# Windows: Open Services app → find MongoDB → click Start
7.2 — Start the backend server
bash# In a terminal, navigate to the backend folder
cd civicchain/backend

# Start with nodemon (auto-restarts on file changes)
npm run dev

# OR start normally (no auto-restart)
npm start
Expected output:
✅ Connected to MongoDB
✅ Grievance contract loaded at address: 0xDef456...
✅ Backend server running on http://localhost:5000
If you see ❌ Grievance.json not found, it means you haven't run truffle compile and truffle migrate yet — go back to Part 4.
If you see ❌ MongoDB connection failed, MongoDB is not running — go back to step 7.1.

📋 PART 8 — Start the Frontend
bash# Open a NEW terminal tab, navigate to the frontend folder
cd civicchain/frontend

# Start the React development server
npm start
React will automatically open your browser at http://localhost:3000
You should see the CivicChain login page.

If the browser does not open automatically, manually go to http://localhost:3000


📋 PART 9 — Test the Full Flow End-to-End
Follow these steps in order to test every feature of the system.

🔵 Step A — Register an Officer account

Go to http://localhost:3000
Click the Register tab
Fill in:

Name: Officer Rajan
Email: officer@test.com
Password: test123
Role: Officer
Wallet Address: paste the MetaMask address you imported from Ganache (e.g. 0xAbCd...)


Click Create Account
You will be redirected to the Officer dashboard — log out immediately


🔵 Step B — Register an Admin account

Go back to http://localhost:3000/login
Click Register
Fill in:

Name: Admin User
Email: admin@test.com
Password: test123
Role: Admin / Auditor
Wallet Address: paste a different Ganache address (use the second account from Ganache)


Click Create Account → log out


🔵 Step C — Register a Citizen account

Go to http://localhost:3000/login
Click Register
Fill in:

Name: Citizen Priya
Email: citizen@test.com
Password: test123
Role: Citizen
Wallet Address: (leave blank — citizens don't need one)


Click Create Account


🔵 Step D — Submit a Grievance (as Citizen)
You should now be on the Citizen dashboard.

Fill in the Submit form:

Title: Large pothole near bus stop
Description: There is a dangerous pothole near the main bus stop that has been there for 3 weeks
Location: Ward 5, MG Road
Category: Roads
Assign to Officer: select Officer Rajan from the dropdown


Click Submit Grievance
Wait a few seconds — Ganache is processing the transaction
You should see: ✅ Grievance submitted! Transaction Hash: 0x...


💡 Open the Ganache desktop app and click the Transactions tab — you will see the transaction recorded on the blockchain!


🔵 Step E — Track the Grievance (as Citizen)

Scroll down to the Track Grievance Status section
Enter ID: 1
Click Track
You should see the grievance details with status Pending


🔵 Step F — Update Status (as Officer)

Log out of the Citizen account
Log in as: officer@test.com / test123
Click 🦊 Connect MetaMask
MetaMask popup appears — click Connect
Your assigned grievances load automatically
You should see the pothole grievance with status Pending
Click ✏️ Update Status
Select: InProgress
Add remarks: Team dispatched, repair scheduled for tomorrow
Click Confirm Update
MetaMask may show a transaction confirmation popup — click Confirm
You should see: ✅ Status updated! Tx: 0x...


🔵 Step G — Verify as Admin

Log out of the Officer account
Log in as: admin@test.com / test123
You should see the Admin dashboard with stats:

Total: 1, In Progress: 1


The grievance card should show status InProgress with the officer's remarks
Try the filter buttons — click InProgress to filter


🔵 Step H — Resolve the Grievance (back as Officer)

Log in again as officer@test.com
Connect MetaMask
Click ✏️ Update Status on the grievance
Select: Resolved
Remarks: Pothole repaired successfully
Click Confirm Update
The grievance now shows Resolved — it cannot be changed further (contract enforces this)


📋 Quick Reference — All Terminal Commands
bash# ── GANACHE ───────────────────────────────────
# Just open the desktop app — no terminal needed

# ── SMART CONTRACT ────────────────────────────
cd civicchain/blockchain
truffle compile              # Compile Grievance.sol
truffle migrate              # Deploy to Ganache (first time)
truffle migrate --reset      # Re-deploy (after contract changes)

# ── BACKEND ───────────────────────────────────
cd civicchain/backend
npm run dev                  # Start with auto-restart (development)
npm start                    # Start normally

# ── FRONTEND ──────────────────────────────────
cd civicchain/frontend
npm start                    # Start React on localhost:3000

📋 Common Errors and Fixes
ErrorCauseFixGrievance.json not foundContract not compiledRun truffle compile then truffle migrateMongoDB connection failedMongoDB not runningStart MongoDB serviceMetaMask not installedExtension missingInstall from metamask.ioOnly the assigned officer can updateWrong MetaMask accountSwitch to the officer's account in MetaMaskCannot read ABIWrong contract address in web3.jsRe-paste address from truffle migrate outputCORS error in browser consoleBackend not runningStart backend with npm run devNetwork does not match in MetaMaskWrong network selectedSwitch MetaMask to "Ganache Local"Frontend shows blank pageReact not startedRun npm start in the frontend folder

✅ You Are Done!
Your complete CivicChain system is running with:

⛓ Blockchain — Ganache at localhost:8545/7545
📄 Smart Contract — Grievance.sol deployed and live
🔌 Backend — Express + Web3.js at localhost:5000
🌐 Frontend — React + Web3.js + MetaMask at localhost:3000
🗄 Database — MongoDB storing only user accounts

Every grievance submission and every status update is permanently recorded on your local Ethereum blockchain — tamper-proof, transparent, and fully traceable.