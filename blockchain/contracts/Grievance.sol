// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * CivicChain — Grievance Smart Contract
 *
 * This contract lives on the local Ganache blockchain.
 * Every grievance submitted, and every status update, is stored HERE permanently.
 * No one can edit or delete this data — that is the power of blockchain.
 *
 * Web3.js calls the functions in this contract from both the React frontend
 * and the Node.js backend.
 */
contract Grievance {

    // ─────────────────────────────────────────────
    // ENUMS & STRUCTS
    // ─────────────────────────────────────────────

    // Status of a grievance — can only move forward: Pending → InProgress → Resolved
    enum Status { Pending, InProgress, Resolved }

    // A single grievance record stored on-chain
    struct GrievanceRecord {
        uint256 id;               // Unique ID (auto-incremented)
        string  title;            // Short title of the complaint
        string  description;      // Full description of the issue
        string  location;         // Location/area of the issue
        string  category;         // E.g. "Roads", "Water", "Electricity"
        address citizen;          // Ethereum address of the citizen who submitted
        address assignedOfficer;  // Ethereum address of the officer assigned
        Status  status;           // Current status (Pending/InProgress/Resolved)
        uint256 timestamp;        // When the grievance was submitted (Unix time)
        string  remarks;          // Officer remarks when updating status
    }

    // ─────────────────────────────────────────────
    // STATE VARIABLES  (stored permanently on-chain)
    // ─────────────────────────────────────────────

    uint256 public grievanceCount = 0;  // Tracks total number of grievances

    // Maps grievance ID → GrievanceRecord
    mapping(uint256 => GrievanceRecord) public grievances;

    // ─────────────────────────────────────────────
    // EVENTS  (emitted on every write — frontend can listen to these)
    // ─────────────────────────────────────────────

    event GrievanceSubmitted(
        uint256 indexed id,
        address indexed citizen,
        string  title,
        uint256 timestamp
    );

    event StatusUpdated(
        uint256 indexed id,
        address indexed officer,
        Status  newStatus,
        string  remarks
    );

    // ─────────────────────────────────────────────
    // FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * submitGrievance()
     * Called by: Citizen (via Web3.js from React frontend)
     * Purpose  : Records a new grievance permanently on the blockchain.
     *
     * @param _title       - Short title of the complaint
     * @param _description - Full description of the issue
     * @param _location    - Where the issue is located
     * @param _category    - Type of issue (Roads, Water, etc.)
     * @param _officer     - Ethereum address of the officer to assign this to
     */
    function submitGrievance(
        string  memory _title,
        string  memory _description,
        string  memory _location,
        string  memory _category,
        address        _officer
    ) public {
        // Increment counter FIRST, so IDs start at 1 (not 0)
        grievanceCount++;

        // Store the new grievance in the mapping
        grievances[grievanceCount] = GrievanceRecord({
            id              : grievanceCount,
            title           : _title,
            description     : _description,
            location        : _location,
            category        : _category,
            citizen         : msg.sender,       // msg.sender = address that called this function
            assignedOfficer : _officer,
            status          : Status.Pending,   // Always starts as Pending
            timestamp       : block.timestamp,  // Current block time
            remarks         : ""                // No remarks yet
        });

        // Emit an event so the frontend can detect this action
        emit GrievanceSubmitted(grievanceCount, msg.sender, _title, block.timestamp);
    }

    /**
     * updateStatus()
     * Called by: Officer (signs with MetaMask → Web3.js sends transaction)
     * Purpose  : Updates the status of a grievance. Only the assigned officer can do this.
     *
     * @param _id       - ID of the grievance to update
     * @param _status   - New status (1 = InProgress, 2 = Resolved)
     * @param _remarks  - Officer's note about the update
     */
    function updateStatus(
        uint256 _id,
        Status  _status,
        string  memory _remarks
    ) public {
        // Make sure the grievance exists
        require(_id > 0 && _id <= grievanceCount, "Grievance does not exist");

        // Get a reference to the grievance (using 'storage' so edits persist)
        GrievanceRecord storage g = grievances[_id];

        // Only the assigned officer is allowed to update
        require(
            msg.sender == g.assignedOfficer,
            "Only the assigned officer can update this grievance"
        );

        // Cannot move status backward (e.g., Resolved → Pending is not allowed)
        require(
            uint8(_status) > uint8(g.status),
            "Status can only move forward"
        );

        // Apply the update
        g.status  = _status;
        g.remarks = _remarks;

        // Emit event
        emit StatusUpdated(_id, msg.sender, _status, _remarks);
    }

    /**
     * getGrievance()
     * Called by: Anyone — Citizen, Officer, Admin (read-only, no gas cost)
     * Purpose  : Returns a single grievance record by ID.
     *
     * @param _id - ID of the grievance to fetch
     * @return    - The full GrievanceRecord struct
     */
    function getGrievance(uint256 _id) public view returns (GrievanceRecord memory) {
        require(_id > 0 && _id <= grievanceCount, "Grievance does not exist");
        return grievances[_id];
    }

    /**
     * getAllGrievances()
     * Called by: Admin/Auditor page (read-only, no gas cost)
     * Purpose  : Returns ALL grievances as an array.
     *            WARNING: This can be slow if there are thousands of records.
     *            For a college mini-project this is perfectly fine.
     *
     * @return - Array of all GrievanceRecord structs
     */
    function getAllGrievances() public view returns (GrievanceRecord[] memory) {
        // Create an in-memory array of the right size
        GrievanceRecord[] memory all = new GrievanceRecord[](grievanceCount);

        // Loop through all grievances and fill the array
        for (uint256 i = 1; i <= grievanceCount; i++) {
            all[i - 1] = grievances[i];  // array is 0-indexed, IDs are 1-indexed
        }

        return all;
    }
}