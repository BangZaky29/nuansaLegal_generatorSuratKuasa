import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Download, User, Users, FileText, Info } from 'lucide-react';
import LogoNuansaLegal from './assets/BKBlank_LogoNuansaLegal.png';
import BannerFooter from './assets/Benner.jpeg';
import './App.css';

function App() {
  // State untuk form data
  const [pemberiKuasa, setPemberiKuasa] = useState({
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    nik: '',
    jenisKelamin: 'Laki-Laki',
    alamat: ''
  });

  const [penerimaKuasaList, setPenerimaKuasaList] = useState([{
    id: 1,
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    nik: '',
    jenisKelamin: 'Laki-Laki',
    alamat: ''
  }]);

  const [perihalKuasa, setPerihalKuasa] = useState({
    maksud: '',
    detail: '',
    nomorRekening: '',
    namaBank: '',
    jumlahUang: ''
  });

  const [infoSurat, setInfoSurat] = useState({
    tempat: '',
    tanggal: new Date().toISOString().split('T')[0]
  });

  // State untuk expand/collapse sections (start closed on load)
  const [expandedSections, setExpandedSections] = useState({
    pemberi: false,
    penerima: false,
    perihal: false,
    info: false
  });

  const previewRef = useRef(null);
  const [pages, setPages] = useState(null); // array of dataURLs for each page
  const [currentPage, setCurrentPage] = useState(0);
  const [isGeneratingPages, setIsGeneratingPages] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      // Close all sections, then toggle the requested one
      const next = {
        pemberi: false,
        penerima: false,
        perihal: false,
        info: false
      };
      next[section] = !prev[section];
      return next;
    });
  };

  const formatTanggal = (tanggal) => {
    if (!tanggal) return '';
    const date = new Date(tanggal);
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatTTL = (tempat, tanggal) => {
    if (!tempat && !tanggal) return '';
    if (!tanggal) return tempat;
    return `${tempat}, ${formatTanggal(tanggal)}`;
  };

  const handleAddPenerima = () => {
    const newId = penerimaKuasaList.length + 1;
    setPenerimaKuasaList([...penerimaKuasaList, {
      id: newId,
      nama: '',
      tempatLahir: '',
      tanggalLahir: '',
      nik: '',
      jenisKelamin: 'Laki-Laki',
      alamat: ''
    }]);
  };

  const handleRemovePenerima = (id) => {
    if (penerimaKuasaList.length > 1) {
      setPenerimaKuasaList(penerimaKuasaList.filter(p => p.id !== id));
    }
  };

  const handlePenerimaChange = (id, field, value) => {
    setPenerimaKuasaList(penerimaKuasaList.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleDownloadPDF = async () => {
    try {
      // Ensure pages are generated
      if (!pages || pages.length === 0) {
        await generatePagesFromElement();
      }

      const jsPDF = (await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm')).jsPDF;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const imgWidthMm = 210;

      for (let i = 0; i < pages.length; i++) {
        const imgData = pages[i];
        // create image to get natural width/height
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const imgWidthPx = img.width;
            const imgHeightPx = img.height;
            const imgHeightMm = (imgHeightPx * imgWidthMm) / imgWidthPx;

            pdf.addImage(img, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
            if (i < pages.length - 1) pdf.addPage();
            resolve();
          };
          img.onerror = (e) => reject(e);
          img.src = imgData;
        });
      }

      pdf.save(`Surat_Kuasa_${pemberiKuasa.nama || 'Draft'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi kesalahan saat membuat PDF. Pastikan semua data telah diisi.');
    }
  };

  // Generate pages from the preview element and store images in `pages`
  const generatePagesFromElement = async () => {
    const element = previewRef.current;
    if (!element) return;

    try {
      setIsGeneratingPages(true);
      const html2canvas = (await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm')).default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const fullWidth = canvas.width;
      // A4 ratio: 210 x 297 mm
      const pageHeightPx = Math.floor((fullWidth * 297) / 210);
      const totalHeight = canvas.height;
      const totalPages = Math.ceil(totalHeight / pageHeightPx);

      const imgs = [];
      for (let p = 0; p < totalPages; p++) {
        const sliceHeight = (p === totalPages - 1) ? (totalHeight - p * pageHeightPx) : pageHeightPx;
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = fullWidth;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, -p * pageHeightPx);
        imgs.push(pageCanvas.toDataURL('image/png'));
      }

      setPages(imgs);
      setCurrentPage(0);
    } catch (err) {
      console.error('Error generating pages:', err);
      setPages(null);
    } finally {
      setIsGeneratingPages(false);
    }
  };

  // Regenerate pages when key data changes (debounced)
  useEffect(() => {
    // reset pages so UI shows live preview while generating
    setPages(null);
    setCurrentPage(0);
    const t = setTimeout(() => {
      generatePagesFromElement();
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pemberiKuasa, penerimaKuasaList, perihalKuasa, infoSurat]);

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <div className="header-logo">
                <img src={LogoNuansaLegal} alt="Nuansa Legal" style={{ width: '98px', height: '98px', objectFit: 'contain' }} />
              </div>
              <div className="header-text">
                <h1>Generator Surat Kuasa</h1>
                <p>Buat surat kuasa profesional dengan mudah</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          <div className="content-grid">
            {/* Left Column - Form */}
            <div className="form-column">
              {/* Biodata Pemberi Kuasa */}
              <div className="form-section">
                <button
                  onClick={() => toggleSection('pemberi')}
                  className="section-header"
                >
                  <div className="section-header-left">
                    <User size={20} />
                    <h2>Biodata Pemberi Kuasa</h2>
                  </div>
                  {expandedSections.pemberi ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                
                {expandedSections.pemberi && (
                  <div className="section-body">
                    <div className="form-group">
                      <label className="form-label">Nama Lengkap *</label>
                      <input
                        type="text"
                        value={pemberiKuasa.nama}
                        onChange={(e) => setPemberiKuasa({...pemberiKuasa, nama: e.target.value})}
                        className="form-input"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Tempat Lahir *</label>
                        <input
                          type="text"
                          value={pemberiKuasa.tempatLahir}
                          onChange={(e) => setPemberiKuasa({...pemberiKuasa, tempatLahir: e.target.value})}
                          className="form-input"
                          placeholder="Kota"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Tanggal Lahir *</label>
                        <input
                          type="date"
                          value={pemberiKuasa.tanggalLahir}
                          onChange={(e) => setPemberiKuasa({...pemberiKuasa, tanggalLahir: e.target.value})}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Nomor KTP/NIK *</label>
                        <input
                          type="text"
                          value={pemberiKuasa.nik}
                          onChange={(e) => setPemberiKuasa({...pemberiKuasa, nik: e.target.value})}
                          className="form-input"
                          placeholder="16 digit"
                          maxLength="16"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Jenis Kelamin *</label>
                        <select
                          value={pemberiKuasa.jenisKelamin}
                          onChange={(e) => setPemberiKuasa({...pemberiKuasa, jenisKelamin: e.target.value})}
                          className="form-select"
                        >
                          <option value="Laki-Laki">Laki-Laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Alamat Lengkap *</label>
                      <textarea
                        value={pemberiKuasa.alamat}
                        onChange={(e) => setPemberiKuasa({...pemberiKuasa, alamat: e.target.value})}
                        className="form-textarea"
                        rows="3"
                        placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Biodata Penerima Kuasa */}
              <div className="form-section">
                <button
                  onClick={() => toggleSection('penerima')}
                  className="section-header"
                >
                  <div className="section-header-left">
                    <Users size={20} />
                    <h2>Biodata Penerima Kuasa</h2>
                  </div>
                  {expandedSections.penerima ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                
                {expandedSections.penerima && (
                  <div className="section-body">
                    {penerimaKuasaList.map((penerima, index) => (
                      <div key={penerima.id} style={{ 
                        border: '1px solid #fde68a', 
                        borderRadius: '0.5rem', 
                        padding: '1rem', 
                        marginBottom: '1rem',
                        position: 'relative'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <strong>Penerima #{index + 1}</strong>
                          {penerimaKuasaList.length > 1 && (
                            <button
                              onClick={() => handleRemovePenerima(penerima.id)}
                              style={{
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              Hapus
                            </button>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Nama Lengkap *</label>
                          <input
                            type="text"
                            value={penerima.nama}
                            onChange={(e) => handlePenerimaChange(penerima.id, 'nama', e.target.value)}
                            className="form-input"
                            placeholder="Masukkan nama lengkap"
                          />
                        </div>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Tempat Lahir *</label>
                            <input
                              type="text"
                              value={penerima.tempatLahir}
                              onChange={(e) => handlePenerimaChange(penerima.id, 'tempatLahir', e.target.value)}
                              className="form-input"
                              placeholder="Kota"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Tanggal Lahir *</label>
                            <input
                              type="date"
                              value={penerima.tanggalLahir}
                              onChange={(e) => handlePenerimaChange(penerima.id, 'tanggalLahir', e.target.value)}
                              className="form-input"
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Nomor KTP/NIK *</label>
                            <input
                              type="text"
                              value={penerima.nik}
                              onChange={(e) => handlePenerimaChange(penerima.id, 'nik', e.target.value)}
                              className="form-input"
                              placeholder="16 digit"
                              maxLength="16"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Jenis Kelamin *</label>
                            <select
                              value={penerima.jenisKelamin}
                              onChange={(e) => handlePenerimaChange(penerima.id, 'jenisKelamin', e.target.value)}
                              className="form-select"
                            >
                              <option value="Laki-Laki">Laki-Laki</option>
                              <option value="Perempuan">Perempuan</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Alamat Lengkap *</label>
                          <textarea
                            value={penerima.alamat}
                            onChange={(e) => handlePenerimaChange(penerima.id, 'alamat', e.target.value)}
                            className="form-textarea"
                            rows="3"
                            placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Add button removed: only a single recipient is supported */}
                  </div>
                )}
              </div>

              {/* Perihal Kuasa */}
              <div className="form-section">
                <button
                  onClick={() => toggleSection('perihal')}
                  className="section-header"
                >
                  <div className="section-header-left">
                    <FileText size={20} />
                    <h2>Perihal Kuasa</h2>
                  </div>
                  {expandedSections.perihal ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                
                {expandedSections.perihal && (
                  <div className="section-body">
                    <div className="form-group">
                      <label className="form-label">Nomor Rekening Bank</label>
                      <input
                        type="text"
                        value={perihalKuasa.nomorRekening}
                        onChange={(e) => setPerihalKuasa({...perihalKuasa, nomorRekening: e.target.value})}
                        className="form-input"
                        placeholder="Contoh: 289374982347"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nama Bank</label>
                      <input
                        type="text"
                        value={perihalKuasa.namaBank}
                        onChange={(e) => setPerihalKuasa({...perihalKuasa, namaBank: e.target.value})}
                        className="form-input"
                        placeholder="Contoh: Bank BCA"
                      />
                    </div>

                    <div className="form-group">
                    </div>
                    <div className="form-group">
                      <label className="form-label">Maksud/Tujuan Kuasa</label>
                      <textarea
                        value={perihalKuasa.maksud}
                        onChange={(e) => setPerihalKuasa({...perihalKuasa, maksud: e.target.value})}
                        className="form-textarea"
                        rows={3}
                        placeholder="Contoh: Mengambil uang di bank"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Detail Tambahan</label>
                      <textarea
                        value={perihalKuasa.detail}
                        onChange={(e) => setPerihalKuasa({...perihalKuasa, detail: e.target.value})}
                        className="form-textarea"
                        rows="3"
                        placeholder="Keterangan tambahan jika diperlukan"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Informasi Surat */}
              <div className="form-section">
                <button
                  onClick={() => toggleSection('info')}
                  className="section-header"
                >
                  <div className="section-header-left">
                    <Info size={20} />
                    <h2>Informasi Surat</h2>
                  </div>
                  {expandedSections.info ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                
                {expandedSections.info && (
                  <div className="section-body">
                    <div className="form-group">
                      <label className="form-label">Tempat Pembuatan Surat *</label>
                      <input
                        type="text"
                        value={infoSurat.tempat}
                        onChange={(e) => setInfoSurat({...infoSurat, tempat: e.target.value})}
                        className="form-input"
                        placeholder="Contoh: Bogor"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tanggal Surat *</label>
                      <input
                        type="date"
                        value={infoSurat.tanggal}
                        onChange={(e) => setInfoSurat({...infoSurat, tanggal: e.target.value})}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownloadPDF}
                className="btn-download"
              >
                <Download size={20} />
                <span>Download PDF</span>
              </button>
            </div>

            {/* Right Column - Preview */}
            <div className="preview-column">
              <div className="preview-container">
                <div className="preview-header">
                  <h2>Preview Surat</h2>
                  <div className="preview-badge">
                    <span>Live Preview</span>
                  </div>
                </div>

                {/* Preview Content */}
                <div
                  ref={previewRef}
                  className="preview-content"
                  style={{ display: pages ? 'none' : 'block' }}
                >
                  {/* Header Surat */}
                  <div className="surat-header">
                    <h1>SURAT KUASA</h1>
                  </div>

                  {/* Pemberi Kuasa */}
                  <div className="surat-section">
                    <p>Yang bertanda tangan di bawah ini:</p>
                    <table className="surat-table">
                      <tbody>
                        <tr>
                          <td>Nama</td>
                          <td>:</td>
                          <td className="font-bold">{pemberiKuasa.nama || '[Nama Pemberi Kuasa]'}</td>
                        </tr>
                        <tr>
                          <td>Tempat/Tgl. Lahir</td>
                          <td>:</td>
                          <td>{formatTTL(pemberiKuasa.tempatLahir, pemberiKuasa.tanggalLahir) || '[Tempat, Tanggal Lahir]'}</td>
                        </tr>
                        <tr>
                          <td>Nomor KTP</td>
                          <td>:</td>
                          <td>{pemberiKuasa.nik || '[Nomor KTP]'}</td>
                        </tr>
                        <tr>
                          <td>Jenis Kelamin</td>
                          <td>:</td>
                          <td>{pemberiKuasa.jenisKelamin}</td>
                        </tr>
                        <tr>
                          <td>Alamat</td>
                          <td>:</td>
                          <td>{pemberiKuasa.alamat || '[Alamat Lengkap]'}</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="mt-3">Selanjutnya dalam surat kuasa ini disebut sebagai <strong>PEMBERI KUASA</strong>.</p>
                  </div>

                  {/* Penerima Kuasa */}
                  {penerimaKuasaList.map((penerima, index) => (
                    <div key={penerima.id} className="surat-section">
                      <p>Dengan ini memberikan kuasa kepada{penerimaKuasaList.length > 1 ? `)` : ''}:</p>
                      <table className="surat-table">
                        <tbody> 
                          <tr>
                            <td>Nama</td>
                            <td>:</td>
                            <td className="font-bold">{penerima.nama || '[Nama Penerima Kuasa]'}</td>
                          </tr>
                          <tr>
                            <td>Tempat/Tgl. Lahir</td>
                            <td>:</td>
                            <td>{formatTTL(penerima.tempatLahir, penerima.tanggalLahir) || '[Tempat, Tanggal Lahir]'}</td>
                          </tr>
                          <tr>
                            <td>Nomor KTP</td>
                            <td>:</td>
                            <td>{penerima.nik || '[Nomor KTP]'}</td>
                          </tr>
                          <tr>
                            <td>Jenis Kelamin</td>
                            <td>:</td>
                            <td>{penerima.jenisKelamin}</td>
                          </tr>
                          <tr>
                            <td>Alamat</td>
                            <td>:</td>
                            <td>{penerima.alamat || '[Alamat Lengkap]'}</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="mt-3">Selanjutnya dalam surat kuasa ini disebut sebagai <strong>PENERIMA KUASA{penerimaKuasaList.length > 1 ? ` ${index + 1}` : ''}</strong>.</p>
                    </div>
                  ))}

                  {/* Keperluan */}
                  <div className="surat-section">
                    <div className="surat-khusus">
                      <p>======================== KHUSUS ========================</p>
                    </div>
                    <p className="text-justify">
                      {perihalKuasa.nomorRekening && perihalKuasa.namaBank ? (
                        <>
                          Untuk mengambil uang di bank {perihalKuasa.namaBank} atas nama pemberi kuasa sebesar {perihalKuasa.jumlahUang || '[Jumlah]'}. 
                          Termasuk menandatangani surat-surat yang berkaitan dengan pengambilannya.
                        </>
                      ) : (
                        <>
                          {perihalKuasa.maksud || '[Tujuan/maksud pemberian kuasa]'}
                          {perihalKuasa.detail && `. ${perihalKuasa.detail}`}
                        </>
                      )}
                    </p>
                    {perihalKuasa.nomorRekening && (
                      <p className="mb-3">Nomor Rekening: <strong>{perihalKuasa.nomorRekening}</strong></p>
                    )}
                    <p className="text-justify">
                      Demikian surat kuasa ini dibuat dengan sesungguhnya untuk dapat dipergunakan sebagaimana mestinya. 
                      Dan apabila di kemudian hari terdapat kesalahan dan/atau sejenis perselisihan maka segala akibat penyalahgunaan dari timbulnya surat kuasa ini akan sepenuhnya menjadi tanggung jawab pemberi kuasa.
                    </p>
                  </div>

                  {/* Tanda Tangan */}
                  <div className="surat-signature">
                    {penerimaKuasaList.length === 1 ? (
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                          {/* Left: Penerima Kuasa */}
                          <div style={{ width: '48%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <p style={{ marginBottom: '3.5rem' }}>Penerima Kuasa</p>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', marginTop: '2rem' }}>
                              <div style={{ width: '90%' }}>
                                <div style={{ borderTop: '1px solid black', paddingTop: '0.25rem' }}>
                                  <p className="signature-name" style={{ fontWeight: '700' }}>{penerimaKuasaList[0].nama || '[Penerima I]'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Pemberi Kuasa (place/date, label, stamp, signature) */}
                          <div style={{ width: '48%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <p style={{ alignSelf: 'flex-center', marginBottom: '0.5rem' }}>{infoSurat.tempat || '[Tempat]'}, {formatTanggal(infoSurat.tanggal)}</p>
                            <p style={{ marginBottom: '0.35rem' }}>Pemberi Kuasa</p>

                            {/* Stamp box placed under Pemberi label so it shows above signature line */}
                            <div style={{ display: 'inline-block', border: '1px solid #000', padding: '0.5rem 0.6rem', margin: '0.5rem 0' }}>Materai 10.000</div>

                            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                              <div style={{ width: '90%' }}>
                                <div style={{ borderTop: '1px solid black', paddingTop: '0.25rem' }}>
                                  <p className="signature-name" style={{ fontWeight: '700' }}>{pemberiKuasa.nama || '[Pemberi]'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* existing multi-recipient layout (leave unchanged) */
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                          <div style={{ width: '58%', textAlign: 'center' }}>
                            <p style={{ marginBottom: '6.7rem' }}>Penerima Kuasa I</p>
                            <div style={{ borderTop: '1px solid black', paddingTop: '0.25rem', marginTop: '2rem' }}>
                              <p style={{ fontWeight: '700', fontSize: '0.95rem' }}>{penerimaKuasaList[0]?.nama || '[Penerima I]'}</p>
                            </div>
                          </div>

                          <div style={{ width: '40%', textAlign: 'center' }}>
                            <p style={{ alignSelf: 'flex-center', marginBottom: '0.5rem' }}>{infoSurat.tempat || '[Tempat]'}, {formatTanggal(infoSurat.tanggal)}</p>
                            <p style={{ marginBottom: '3.5rem'}}>Pemberi Kuasa</p>
                            <div style={{ display: 'inline-block', border: '1px solid #000', padding: '0.5rem 0.6rem', margin: '0.5rem 0' }}>Materai 10.000</div>
                            <div style={{ borderTop: '1px solid black', paddingTop: '0.25rem' }}>
                              <p style={{ fontWeight: '700', fontSize: '0.95rem' }}>{pemberiKuasa.nama || '[Pemberi]'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Remaining recipients listed vertically with signature placeholders */}
                        <div>
                          {penerimaKuasaList.slice(1).map((p, idx) => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0' }}>
                              <div style={{ textAlign: 'left' }}>
                                <p style={{ margin: 0 }}>{p.nama || `{ Penerima Kuasa ${idx + 2} }`}</p>
                              </div>
                              <div style={{ width: '40%', textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid black', paddingTop: '0.25rem', width: '70%', margin: '0 auto' }}>
                                  <p style={{ margin: 0, fontWeight: '700' }}>{p.nama ? '' : ''}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Paginated preview images (shown when pages are generated) */}
                {pages && pages.length > 0 && (
                  <div className="paginated-preview" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div>
                        <strong>Preview Pages</strong>
                        <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>{isGeneratingPages ? ' (Membuat halaman...)' : ` (${pages.length} halaman)`}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                          disabled={currentPage === 0}
                          style={{ padding: '0.45rem 0.9rem', cursor: 'pointer', marginRight: '0.25rem', borderRadius: '6px' }}
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                          disabled={currentPage === pages.length - 1}
                          style={{ padding: '0.45rem 0.9rem', cursor: 'pointer', marginLeft: '0.25rem', borderRadius: '6px' }}
                        >
                          Next
                        </button>
                      </div>
                    </div>

                    <div style={{ border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: '0.25rem', background: 'white' }}>
                      <img src={pages[currentPage]} alt={`Page ${currentPage + 1}`} style={{ width: '100%', display: 'block' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                      {pages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPage(idx)}
                          style={{
                            padding: '0.45rem 0.85rem',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            border: idx === currentPage ? '2px solid #059669' : '1px solid #d1d5db',
                            background: idx === currentPage ? '#ecfdf5' : 'white',
                            margin: '0.25rem'
                          }}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <div className="footer-content">
            <p>Generator Surat Kuasa - Generated Automatically</p>
            <p className="footer-note">@ 2025 nuansalegal.id. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;