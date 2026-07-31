// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EvidenceRegistry
 * @dev Decentralized Evidence Registry for AntiGravity Digital Evidence Management System.
 * Stores immutable evidence metadata, IPFS CIDs, and SHA-256 hashes on the Polygon blockchain.
 */
contract EvidenceRegistry is Ownable {
    struct EvidenceRecord {
        string evidenceId;
        string ipfsCID;
        string sha256Hash;
        uint256 uploadedAt;
        string uploadedBy;
        uint8 trustScore;
        bool verified;
    }

    // Mapping from evidenceId to EvidenceRecord
    mapping(string => EvidenceRecord) private evidences;
    
    // Array of all registered evidence IDs
    string[] private evidenceIds;

    // Events
    event EvidenceAdded(
        string indexed evidenceId,
        string ipfsCID,
        string sha256Hash,
        uint256 uploadedAt,
        string uploadedBy,
        uint8 trustScore
    );

    event EvidenceVerified(string indexed evidenceId, bool isValid);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Add a new evidence record to the blockchain.
     */
    function addEvidence(
        string memory _evidenceId,
        string memory _ipfsCID,
        string memory _sha256Hash,
        string memory _uploadedBy,
        uint8 _trustScore
    ) external {
        require(bytes(_evidenceId).length > 0, "Evidence ID cannot be empty");
        require(bytes(_sha256Hash).length > 0, "SHA-256 hash cannot be empty");
        require(!evidences[_evidenceId].verified, "Evidence ID already registered");

        EvidenceRecord memory record = EvidenceRecord({
            evidenceId: _evidenceId,
            ipfsCID: _ipfsCID,
            sha256Hash: _sha256Hash,
            uploadedAt: block.timestamp,
            uploadedBy: _uploadedBy,
            trustScore: _trustScore,
            verified: true
        });

        evidences[_evidenceId] = record;
        evidenceIds.push(_evidenceId);

        emit EvidenceAdded(
            _evidenceId,
            _ipfsCID,
            _sha256Hash,
            block.timestamp,
            _uploadedBy,
            _trustScore
        );
    }

    /**
     * @dev Retrieve evidence metadata by evidenceId.
     */
    function getEvidence(string memory _evidenceId)
        external
        view
        returns (
            string memory evidenceId,
            string memory ipfsCID,
            string memory sha256Hash,
            uint256 uploadedAt,
            string memory uploadedBy,
            uint8 trustScore,
            bool verified
        )
    {
        require(evidences[_evidenceId].verified, "Evidence not found");
        EvidenceRecord memory record = evidences[_evidenceId];
        return (
            record.evidenceId,
            record.ipfsCID,
            record.sha256Hash,
            record.uploadedAt,
            record.uploadedBy,
            record.trustScore,
            record.verified
        );
    }

    /**
     * @dev Verify if a given SHA-256 hash matches the registered on-chain hash.
     */
    function verifyEvidence(string memory _evidenceId, string memory _sha256Hash)
        external
        view
        returns (bool)
    {
        if (!evidences[_evidenceId].verified) {
            return false;
        }
        return keccak256(bytes(evidences[_evidenceId].sha256Hash)) == keccak256(bytes(_sha256Hash));
    }

    /**
     * @dev Check if evidence exists on-chain.
     */
    function evidenceExists(string memory _evidenceId) external view returns (bool) {
        return evidences[_evidenceId].verified;
    }

    /**
     * @dev Returns total number of registered evidence items.
     */
    function totalEvidenceCount() external view returns (uint256) {
        return evidenceIds.length;
    }
}
