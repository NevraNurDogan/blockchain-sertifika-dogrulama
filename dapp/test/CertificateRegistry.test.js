const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry Contract", function () {
  let CertificateRegistry;
  let registry;
  let owner;
  let addr1;

  const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    registry = await CertificateRegistry.deploy();

  });

  it("Sadece ISSUER_ROLE sertifika ekleyebilmeli", async function () {

    const id = ethers.encodeBytes32String("ID1");
    const hash = ethers.id("hash123");
    const tx = registry.issue(id, hash, "Basari Belgesi", "KTU", 0);

    await expect(tx).to.emit(registry, "CertificateIssued");

    const id2 = ethers.encodeBytes32String("ID2");
    await expect(
      registry.connect(addr1).issue(id2, hash, "Test", "KTU", 0)
    ).to.be.reverted;
  });

  it("Sertifika dogrulanabilmeli ve iptal edilebilmeli (Revoke)", async function () {
    const id = ethers.encodeBytes32String("ID_TEST_01");
    const hash = ethers.id("ogrenci_tc_ve_isim_hashi");

    await registry.issue(id, hash, "Mezuniyet Belgesi", "KTU", 0);

    let cert = await registry.verify(id, hash);


    expect(cert[0]).to.equal(true);

    await registry.revoke(id);

    cert = await registry.verify(id, hash);
    expect(cert[0]).to.equal(false);
  });
});