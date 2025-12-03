// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract CertificateRegistry is AccessControl {

    
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Certificate {
        bytes32 id;           // String yerine bytes32 (Daha ucuz gas)
        bytes32 holderHash;   // KVKK hash (bytes32)
        string title;
        string issuer;
        uint64 issuedAt;      // uint256 yerine uint64
        uint64 expiresAt;     // 0 ise süresiz
        bool revoked;         // İptal durumu
    }

    mapping(bytes32 => Certificate) public certificates;

    event CertificateIssued(bytes32 indexed id, bytes32 indexed holderHash, string title, uint64 issuedAt);
    event CertificateRevoked(bytes32 indexed id, uint64 revokedAt);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }

    function issue(
        bytes32 _id, 
        bytes32 _holderHash, 
        string calldata _title, 
        string calldata _issuer,
        uint64 _expiresAt
    ) external onlyRole(ISSUER_ROLE) {
        require(certificates[_id].issuedAt == 0, "Bu ID zaten var");

        certificates[_id] = Certificate({
            id: _id,
            holderHash: _holderHash,
            title: _title,
            issuer: _issuer,
            issuedAt: uint64(block.timestamp),
            expiresAt: _expiresAt,
            revoked: false
        });

        emit CertificateIssued(_id, _holderHash, _title, uint64(block.timestamp));
    }

    function revoke(bytes32 _id) external onlyRole(ISSUER_ROLE) {
        Certificate storage c = certificates[_id];
        require(c.issuedAt != 0, "Sertifika bulunamadi");
        require(!c.revoked, "Zaten iptal edilmis");
        
        c.revoked = true;
        emit CertificateRevoked(_id, uint64(block.timestamp));
    }

    function verify(bytes32 _id, bytes32 _checkHash) external view returns (
        bool valid, 
        bool isRevoked, 
        uint64 issuedAt, 
        uint64 expiresAt, 
        string memory title, 
        string memory issuer
    ) {
        Certificate memory c = certificates[_id];
        
        if (c.issuedAt == 0) {
            return (false, false, 0, 0, "", "");
        }

        bool timeValid = (c.expiresAt == 0 || c.expiresAt >= block.timestamp);
        bool hashValid = (c.holderHash == _checkHash);
        
        bool isOk = (!c.revoked && hashValid && timeValid);

        return (isOk, c.revoked, c.issuedAt, c.expiresAt, c.title, c.issuer);
    }
}