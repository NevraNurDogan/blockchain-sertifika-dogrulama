const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry Sistemi", function () {
  let CertificateRegistry;
  let registry;
  let owner;
  let addr1;
  let unauthorizedUser;


  const createHash = (tc, name, salt) => {
     const raw = `${tc}|${name}|${salt}`;
     return ethers.keccak256(ethers.toUtf8Bytes(raw));
  }

  const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));

  beforeEach(async function () {
    [owner, addr1, unauthorizedUser] = await ethers.getSigners();
    CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    registry = await CertificateRegistry.deploy();
  });

  it("1. Yetkili (Issuer) sertifika oluşturabilmeli", async function () {
    const id = ethers.encodeBytes32String("CERT_001");
    const hash = createHash("85264178523", "AHMET AÇIKGÖZ", "randomSalt123");
    
    await expect(registry.issue(id, hash, "Diploma", "KTUN", 0))
      .to.emit(registry, "CertificateIssued")
      .withArgs(id, hash, "Diploma", (any) => true); 
  });

  it("2. Yetkisiz kullanıcı sertifika EKLEYEMEMELİ (AccessControl)", async function () {
    const id = ethers.encodeBytes32String("CERT_HACK");
    const hash = ethers.id("fakeHash");
    

    await expect(
      registry.connect(unauthorizedUser).issue(id, hash, "Fake", "Hacker", 0)
    ).to.be.reverted; 
  });

  it("3. Sertifika doğrulama (Verify) doğru çalışmalı", async function () {
    const id = ethers.encodeBytes32String("CERT_002");
    const hash = createHash("11111111111", "ZEYNEP DEMIR", "tuz123");

    await registry.issue(id, hash, "Onur Belgesi", "KTUN", 0);


    const result = await registry.verify(id, hash);
    expect(result.valid).to.equal(true);
    expect(result.title).to.equal("Onur Belgesi");


    const fakeHash = createHash("11111111111", "ZEYNEP DEMIR", "YANLIS_TUZ");
    const fakeResult = await registry.verify(id, fakeHash);
    expect(fakeResult.valid).to.equal(false);
  });

  it("4. Sertifika iptali (Revoke) çalışmalı", async function () {
    const id = ethers.encodeBytes32String("CERT_REVOKE");
    const hash = ethers.id("someHash");
    await registry.issue(id, hash, "Gecici Belge", "KTUN", 0);

  
    await registry.revoke(id);


    const result = await registry.verify(id, hash);
    expect(result.valid).to.equal(false); 
    expect(result.isRevoked).to.equal(true); 
  });
});