import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

const CONTRACT_ADDRESS = "0x59d3631c86BbE35EF041872d502F218A39FBa150"; 

const ABI = [
  "function issue(bytes32 _id, bytes32 _holderHash, string _title, string _issuer, uint64 _expiresAt) public",
  "function verify(bytes32 _id, bytes32 _checkHash) public view returns (bool, bool, uint64, uint64, string, string)",
  "function revoke(bytes32 _id) public"
];

function App() {
  const [contract, setContract] = useState(null);
  
  const [id, setId] = useState("");
  const [tc, setTc] = useState("");
  const [name, setName] = useState("");
  const [salt, setSalt] = useState(""); 
  const [title, setTitle] = useState("Yazılım Müh. Diploması");
  
  const [verifyResult, setVerifyResult] = useState(null);

  const [history, setHistory] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const _provider = new ethers.JsonRpcProvider("http://localhost:8545");
        const _signer = await _provider.getSigner(0); 
        const _contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, _signer);
        setContract(_contract);
        
        const savedHistory = localStorage.getItem("certHistory");
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }

      } catch (e) {
        console.error("Bağlantı hatası (Docker açık mı?):", e);
      }
    };
    init();
  }, []);

  const formatBytes32String = (text) => {
    try {
        return ethers.encodeBytes32String(text);
    } catch (e) {
        alert("ID formatı hatası! ID 31 karakterden kısa olmalı.");
        return null;
    }
  };

  const createHash = () => {
    const rawData = `${tc.trim()}|${name.toUpperCase().trim()}|${salt.trim()}`;
    return ethers.keccak256(ethers.toUtf8Bytes(rawData));
  };

  const generateRandomSalt = () => {

    const randomValues = new Uint8Array(16);
    window.crypto.getRandomValues(randomValues);
    const hexString = Array.from(randomValues)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    setSalt(hexString);
  };

  const addToHistory = (certData) => {
      const newHistory = [certData, ...history]; 
      setHistory(newHistory);
      localStorage.setItem("certHistory", JSON.stringify(newHistory));
  };

  const clearHistory = () => {
      if(window.confirm("Listeyi temizlemek istediğine emin misin?")) {
          setHistory([]);
          localStorage.removeItem("certHistory");
      }
  };


  const handleIssue = async () => {
    if (!contract) return alert("Bağlantı yok! Docker'ı kontrol et.");
    if (!id || !tc || !name || !salt) return alert("Lütfen tüm alanları ve Salt'ı doldurun.");

    const idBytes32 = formatBytes32String(id);
    if (!idBytes32) return;

    try {
      const hash = createHash();
      
      const tx = await contract.issue(idBytes32, hash, title, "Konya Teknik Univ", 0);
      await tx.wait();
      
      alert(`Sertifika Başarıyla Eklendi!`);
      
      addToHistory({
          id: id,
          name: name,
          title: title,
          salt: salt, 
          date: new Date().toLocaleString()
      });

    } catch (error) {
      alert("Hata: " + error.message);
    }
  };

  const handleVerify = async () => { 
    if (!contract) return alert("Bağlantı yok!");
    if (!id) return alert("Sorgulamak için bir ID girin!");
    if (!salt) return alert("Doğrulama için Salt (Tuz) değerini girmelisiniz!");

    const idBytes32 = formatBytes32String(id);
    if (!idBytes32) return;

    try {
      const calculatedHash = createHash();
      
      const result = await contract.verify(idBytes32, calculatedHash);

      setVerifyResult({
        queriedId: id, 
        isValid: result[0],   
        isRevoked: result[1],  
        title: result[4],     
        issuer: result[5]     
      });

    } catch (error) {
      alert("Sorgulama Hatası (ID bulunamadı veya ağ hatası): " + error.message);
    }
  };

  const handleRevoke = async () => {
    if (!contract) return;
    if (!id) return alert("İptal edilecek Sertifika ID'sini yazmalısın!");

    const idBytes32 = formatBytes32String(id);
    if (!idBytes32) return;

    try {
      const tx = await contract.revoke(idBytes32);
      await tx.wait();
      alert(`⛔ ${id} nolu sertifika İPTAL EDİLDİ!`);
      handleVerify(); 
    } catch (error) {
      alert("Hata: " + error.message);
    }
  };

  return (
    <div style={{ 
        padding: "40px", 
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", 
        maxWidth: "900px", 
        margin: "0 auto", 
        backgroundColor: "#ffffff",
        minHeight: "100vh",
        color: "#333333" 
    }}>
      <h1 style={{textAlign: "center", color: "#333"}}> KTÜN Blockchain Sertifika Sistemi</h1>
      
     
      <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
        <h3 style={{marginTop: 0, color: "#333"}}>Sertifika Bilgileri</h3>
        
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px"}}>
         
          <div style={{display:"flex", flexDirection:"column", gap:"10px"}}>
             <input placeholder="Sertifika ID (Örn: 101)" value={id} onChange={e => setId(e.target.value)} style={inputStyle} />
             <input placeholder="Öğrenci TC" value={tc} onChange={e => setTc(e.target.value)} style={inputStyle} />
             <input placeholder="Ad Soyad" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>

          
          <div style={{display:"flex", flexDirection:"column", gap:"10px"}}>
             <input placeholder="Sertifika Başlığı" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
             
      
             <div style={{display: "flex", gap: "5px"}}>
                <input 
                    type="text" 
                    placeholder="Gizli Salt (Tuz)" 
                    value={salt} 
                    onChange={e => setSalt(e.target.value)} 
                    style={{...inputStyle, flex: 1}} 
                />
                <button onClick={generateRandomSalt} style={{...btnStyle("#666"), width: "auto", fontSize:"12px"}}>
                   🔄 Rastgele Üret
                </button>
             </div>
             <small style={{color: "#888", fontSize: "11px"}}>* Salt değerini saklayın, doğrulama için gereklidir!</small>
          </div>
        </div>
      </div>


      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={{ flex: 1, padding: "15px", border: "1px solid #4CAF50", borderRadius: "8px" }}>
          <h3 style={{margin: "0 0 10px 0", color: "#4CAF50"}}>Yönetici Paneli</h3>
          <div style={{display:"flex", gap:"10px"}}>
             <button onClick={handleIssue} style={btnStyle("#4CAF50")}>Sertifikayı Oluştur</button>
             <button onClick={handleRevoke} style={btnStyle("#d9534f")}>İPTAL ET (Revoke)</button>
          </div>
        </div>

        <div style={{ flex: 1, padding: "15px", border: "1px solid #008CBA", borderRadius: "8px" }}>
          <h3 style={{margin: "0 0 10px 0", color: "#008CBA"}}>Doğrulama</h3>
          <button onClick={handleVerify} style={btnStyle("#008CBA")}>Sorgula</button>
        </div>
      </div>


      {verifyResult && (
        <div style={{ 
          padding: "20px", 
          marginBottom: "20px",
          borderRadius: "10px", 
          color: "#000000",
          background: verifyResult.isValid ? "#e8f5e9" : "#ffebee", 
          border: `2px solid ${verifyResult.isValid ? "#66bb6a" : "#ef5350"}`
        }}>
          <h2 style={{marginTop: 0, color: verifyResult.isValid ? "#2e7d32" : "#c62828"}}>
            {verifyResult.queriedId} {verifyResult.isValid ? "✅ GEÇERLİ" : "❌ GEÇERSİZ"}
          </h2>
          
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px"}}>
              <div><strong>Başlık:</strong> {verifyResult.title || "-"}</div>
              <div><strong>Kurum:</strong> {verifyResult.issuer || "-"}</div>
          </div>

          {verifyResult.isRevoked && (
              <div style={{marginTop: "10px", padding: "8px", backgroundColor: "#ffcccb", color: "#d32f2f", fontWeight: "bold", textAlign: "center", borderRadius: "5px"}}>
                  ⚠️ BU SERTİFİKA KURUM TARAFINDAN İPTAL EDİLMİŞTİR!
              </div>
          )}
          
          <hr style={{borderColor: "#ccc"}}/>
          
          <div>
              <strong>Durum: </strong>
              {verifyResult.isValid ? 
                <span style={{color:"green", fontWeight:"bold"}}>Doğrulaması Başarılı (Veriler Uyuşuyor)</span> : 
                <span style={{color:"red", fontWeight:"bold"}}>
                   {verifyResult.isRevoked ? "İptal Edilmiş" : "HATA! (Salt yanlış, veri değiştirilmiş veya süresi dolmuş)"}
                </span>
              }
          </div>
        </div>
      )}

      <div style={{marginTop: "40px"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <h3 style={{color: "#333"}}>📋 Oluşturulan Sertifikalar (Geçmiş)</h3>
            <button onClick={clearHistory} style={{padding:"5px 10px", background:"#ddd", border:"none", borderRadius:"5px", cursor:"pointer", color: "#333"}}>Listeyi Temizle</button>
          </div>
          
          <table style={{width: "100%", borderCollapse: "collapse", fontSize:"14px", marginTop:"10px", color: "#333"}}>
              <thead>
                  <tr style={{background:"#eee", textAlign:"left"}}>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>İsim</th>
                      <th style={thStyle}>Başlık</th>
                      <th style={thStyle}>Salt (Tuz)</th>
                      <th style={thStyle}>Tarih</th>
                  </tr>
              </thead>
              <tbody>
                  {history.length === 0 ? <tr><td colSpan="5" style={{padding:"10px", textAlign:"center"}}>Henüz kayıt yok.</td></tr> : null}
                  {history.map((item, index) => (
                      <tr key={index} style={{borderBottom: "1px solid #ddd"}}>
                          <td style={tdStyle}>{item.id}</td>
                          <td style={tdStyle}>{item.name}</td>
                          <td style={tdStyle}>{item.title}</td>
                          <td style={{...tdStyle, fontFamily:"monospace", color:"#555"}}>{item.salt}</td>
                          <td style={tdStyle}>{item.date}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
          <p style={{fontSize:"12px", color:"#777"}}>* Bu liste sadece tarayıcı önbelleğindedir, Blockchain'den gelmez.</p>
      </div>

    </div>
  );
}


const inputStyle = { padding: "10px", borderRadius: "5px", border: "1px solid #ddd", width: "100%", boxSizing: "border-box", color: "#333", backgroundColor: "#fff" };
const btnStyle = (color) => ({ backgroundColor: color, color: "white", padding: "10px", border: "none", borderRadius: "5px", cursor: "pointer", width: "100%", fontWeight: "bold" });
const thStyle = { padding: "10px", borderBottom: "2px solid #ccc" };
const tdStyle = { padding: "10px" };

export default App;