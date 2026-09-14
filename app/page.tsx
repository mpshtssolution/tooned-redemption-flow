'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Step = 'welcome' | 'details' | 'create' | 'extras' | 'delivery' | 'review' | 'done'
type Extra = 'print' | 'frame' | 'second' | 'rush' | ''

const extraData: Record<Exclude<Extra, ''>, { name: string; detail: string; price: number; tag: string }> = {
  print: { name: 'Make it big', detail: '12 × 16 in · museum-quality paper', price: 899, tag: 'BIG' },
  frame: { name: 'Put a frame on it', detail: 'Solid oak finish · ready to hang', price: 1499, tag: 'FRAME' },
  second: { name: 'Toon someone else', detail: 'A second Tooned human · same order', price: 699, tag: 'TWO' },
  rush: { name: 'Skip the queue', detail: 'Priority dispatch · ships sooner', price: 299, tag: 'FAST' },
}

export default function Home() {
  const [step, setStep] = useState<Step>('welcome')
  const [code, setCode] = useState('TOON-7K4P-92MX')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [extra, setExtra] = useState<Extra>('')
  const [uploaded, setUploaded] = useState(false)
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [touched, setTouched] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [actionError, setActionError] = useState('')
  const [checkingCode, setCheckingCode] = useState(false)
  const [redemptionId, setRedemptionId] = useState('')
  const [finishing, setFinishing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const qrCode = params.get('code')
    if (qrCode) setCode(qrCode.toUpperCase())
  }, [])

  const steps: Step[] = ['welcome', 'details', 'create', 'extras', 'delivery', 'review']
  const index = steps.indexOf(step)
  const progress = step === 'done' ? 100 : Math.max(8, ((index + 1) / steps.length) * 100)
  const selectedExtra = extra ? extraData[extra] : null
  const price = useMemo(() => selectedExtra?.price ?? 0, [selectedExtra])
  const detailsValid = name.trim().length > 1 && email.includes('@')
  const deliveryValid = address.trim().length > 8 && phone.replace(/\D/g, '').length >= 10
  const next = (s: Step) => { setActionError(''); setStep(s) }

  async function validateCode() {
    const normalized = code.trim().toUpperCase()
    if (!normalized) { setCodeError('Enter your gift code to continue.'); return }
    setCheckingCode(true); setCodeError('')
    try {
      const response = await fetch(`/api/gift-codes/${encodeURIComponent(normalized)}`)
      const data = await response.json()
      if (!response.ok || !data.valid) {
        const message = data.reason === 'already_redeemed' ? 'This gift code has already been redeemed.' : data.reason === 'void' ? 'This gift code is no longer active.' : data.reason === 'expired' ? 'This gift code has expired.' : 'We couldn’t find that gift code. Check it and try again.'
        setCodeError(message); return
      }
      next('details')
    } catch { setCodeError('We couldn’t check that code right now. Please try again.') }
    finally { setCheckingCode(false) }
  }

  async function startRedemption() {
    if (!detailsValid) return
    setFinishing(true); setActionError('')
    try {
      const response = await fetch('/api/redemptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, name, email }) })
      const data = await response.json()
      if (!response.ok || !data.ok) { setCodeError(data.reason === 'already_redeemed' ? 'This gift code has already been redeemed.' : 'We couldn’t start your redemption. Please try again.'); next('welcome'); return }
      setRedemptionId(data.redemptionId); next('create')
    } catch { setCodeError('We couldn’t start your redemption. Please try again.'); next('welcome') }
    finally { setFinishing(false) }
  }

  function handleFile(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { setActionError('Please choose a JPG, PNG or WEBP image under 10MB.'); return }
    setUploaded(true); setFileName(file.name); setPhotoUrl(''); setActionError('')
    setPreview(URL.createObjectURL(file))
  }

  async function uploadPhotoAndContinue() {
    const file = fileRef.current?.files?.[0]
    if (!file || !redemptionId) return
    setUploading(true); setActionError('')
    try {
      const form = new FormData(); form.append('file', file)
      const response = await fetch('/api/uploads', { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.reason || 'upload_failed')
      setPhotoUrl(data.url); next('extras')
    } catch { setActionError('We couldn’t upload that photo. Please try again.') }
    finally { setUploading(false) }
  }

  async function confirmGift() {
    if (!deliveryValid || !redemptionId) return
    setFinishing(true); setActionError('')
    try {
      const response = await fetch('/api/redemptions/finalize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redemptionId, code, address, phone, photoUrl }) })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.reason || 'finalize_failed')
      next('done')
    } catch { setActionError('We couldn’t confirm your gift just yet. Please try again.') }
    finally { setFinishing(false) }
  }

  return <div className="shell">
    <div className="grain" />
    <header className="top"><button className="logo" onClick={() => setStep('welcome')} aria-label="Back to beginning">TOONED<span>®</span></button><div className="pill">Your gift · Included</div></header>
    <div className="progress"><i style={{ width: `${progress}%` }} /></div>

    {step === 'welcome' && <main className="welcomeMain"><span className="float f1">made for you ↗</span><span className="float f2">✦</span><div className="grid welcomeGrid"><section className="hero"><div className="step">01 / Your gift</div><h1>Your portrait is <em>waiting.</em></h1><p className="lede">Someone thought you deserved a little more personality. Your custom Tooned portrait is already yours — just make it you.</p><div className="giftLine"><span>✦</span> No shopping. No checkout. Just your portrait.</div><div className="codebox"><input value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError('') }} aria-label="Gift code" /><button className="btn" disabled={checkingCode} onClick={validateCode}>{checkingCode ? 'Checking…' : 'Let’s go →'}</button></div>{codeError ? <p className="error">{codeError}</p> : <p className="tiny">Gift code detected · your portrait is included</p>}</section><Art /></div></main>}

    {step === 'details' && <main><div className="grid"><section><div className="step">02 / About you</div><h1 className="display">Okay, who are we<br/><em>tooning?</em></h1><p className="lede">Name. Email. Then we get to the fun bit.</p></section><section className="card"><div className="field"><label>YOUR NAME</label><input autoFocus placeholder="e.g. Ankur" value={name} onChange={e => setName(e.target.value)} /></div><div className="field"><label>EMAIL ADDRESS</label><input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div><div className="cardHint">We’ll send your confirmation and delivery updates here.</div><div className="actions"><button className="back" onClick={() => next('welcome')}>← Back</button><button className="btn" disabled={!detailsValid || finishing} onClick={startRedemption}>{finishing ? 'Starting…' : 'Create my portrait →'}</button></div></section></div></main>}

    {step === 'create' && <main><div className="grid"><section><div className="step">03 / Make it yours</div><h1 className="display">Give us your<br/><em>good side.</em></h1><p className="lede">One good photo. That’s all we need. We’ll handle the toon-ing.</p><div className="photoRules"><span>01</span><div><strong>Clear face</strong><small>Front-facing works best</small></div><span>02</span><div><strong>Good light</strong><small>No sunglasses, please</small></div></div><div className="actions"><button className="back" onClick={() => next('details')}>← Back</button></div></section><section className="card uploadCard"><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => handleFile(e.target.files?.[0])} /><div className={`upload ${uploaded ? 'uploaded' : ''}`} onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}>{uploaded ? <><div className="previewWrap">{preview && <img src={preview} alt="Selected portrait preview" />}<div className="previewCheck">✓</div></div><div className="uploadSuccess"><b>Photo looks good ✦</b><span>{fileName}</span><small>Click to choose another</small></div></> : <div><div className="uploadIcon">↑</div><b>Drop your photo here</b><span>or click to choose from your device</span><small>Clear face · good light · no filters needed</small></div>}</div>{actionError && <p className="error">{actionError}</p>}<div className="uploadFoot"><span className="tiny">JPG / PNG / WEBP · up to 10MB</span><button className="btn" disabled={!uploaded || uploading} onClick={uploadPhotoAndContinue}>{uploading ? 'Uploading…' : 'Looks good →'}</button></div></section></div></main>}

    {step === 'extras' && <main><div className="grid"><section><div className="step">04 / Optional extras</div><h1 className="display">Since you’re<br/><em>here...</em></h1><p className="lede">Your portrait is already yours. But we’ve got a few tempting ideas.</p><div className="giftNote"><span>✦</span><div><strong>Your original gift stays ₹0</strong><small>Nothing here is required to redeem it.</small></div></div></section><section className="card extrasCard"><div className="choices">{(Object.keys(extraData) as Exclude<Extra, ''>[]).map(key => { const item = extraData[key]; return <button key={key} className={`choice ${extra === key ? 'selected' : ''}`} onClick={() => setExtra(extra === key ? '' : key)}><span className="choiceTick">{extra === key ? '✓' : '+'}</span><div><small className="choiceTag">{item.tag}</small><strong>{item.name}</strong><small>{item.detail}</small></div><b>+ ₹{item.price.toLocaleString('en-IN')}</b></button> })}</div><div className="price"><span>{selectedExtra ? selectedExtra.name : 'Your gift'}</span><span className={selectedExtra ? '' : 'free'}>{selectedExtra ? `₹${price.toLocaleString('en-IN')}` : '₹0 · Included'}</span></div><div className="actions"><button className="back" onClick={() => next('create')}>← Back</button><button className="btn" onClick={() => next('delivery')}>{selectedExtra ? 'Keep this upgrade →' : 'No thanks — I’m good'}</button></div></section></div></main>}

    {step === 'delivery' && <main><div className="grid"><section><div className="step">05 / Almost there</div><h1 className="display">Where should<br/>we <em>send it?</em></h1><p className="lede">One last thing. Then we’ll get your portrait moving.</p><div className="shippingNote"><span>↗</span><div><strong>Made for you. Sent to you.</strong><small>We’ll only use your number for delivery updates.</small></div></div></section><section className="card"><div className="field"><label>DELIVERY ADDRESS</label><textarea rows={4} placeholder="House / Flat, street, city, state, PIN" value={address} onChange={e => setAddress(e.target.value)} /></div><div className="field"><label>PHONE NUMBER</label><input placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} /></div><div className="price"><span>Tooned portrait</span><span className="free">₹0 · Gift</span></div>{selectedExtra && <div className="price compact"><span>{selectedExtra.name}</span><span>+ ₹{price.toLocaleString('en-IN')}</span></div>}{touched && !deliveryValid && <p className="error">Add a complete delivery address and 10-digit phone number.</p>}{actionError && <p className="error">{actionError}</p>}<div className="actions"><button className="back" onClick={() => next('extras')}>← Back</button><button className="btn" onClick={() => { setTouched(true); if (deliveryValid) next('review') }}>{selectedExtra ? `Review ₹${price.toLocaleString('en-IN')} →` : 'Review my gift →'}</button></div></section></div></main>}

    {step === 'review' && <main><div className="grid"><section><div className="step">06 / One last look</div><h1 className="display">Looks <em>good?</em></h1><p className="lede">Take a final look before we make it official.</p><div className="shippingNote"><span>✦</span><div><strong>Your portrait is included</strong><small>{selectedExtra ? 'You’ve added one optional upgrade.' : 'No payment is needed for your gift.'}</small></div></div></section><section className="card"><div className="reviewPhoto">{preview && <img src={preview} alt="Your selected portrait" />}</div><div className="price first"><span>Name</span><strong>{name}</strong></div><div className="price"><span>Email</span><span>{email}</span></div><div className="price"><span>Delivery</span><span>{address}</span></div><div className="price"><span>Portrait</span><span className="free">Included · ₹0</span></div>{selectedExtra && <div className="price"><span>{selectedExtra.name}</span><span>₹{price.toLocaleString('en-IN')}</span></div>}<div className="actions"><button className="back" onClick={() => next('delivery')}>← Back</button><button className="btn" disabled={finishing} onClick={confirmGift}>{finishing ? 'Confirming…' : selectedExtra ? `Continue to payment →` : 'Confirm my gift →'}</button></div>{selectedExtra && <p className="tiny" style={{ marginTop: 12 }}>Payment for the upgrade will be added in the next step.</p>}{actionError && <p className="error">{actionError}</p>}</section></div></main>}

    {step === 'done' && <main className="doneMain"><section className="success"><div className="check">✓</div><div className="step">You’re officially Tooned</div><h1>That’s a<br/><em>wrap.</em></h1><p>Your portrait is on its way to becoming your new favourite thing. We’ll send the details to <strong>{email || 'your email'}</strong>.</p><div className="nextSteps"><div><span>01</span><strong>We create your portrait</strong></div><i>↓</i><div><span>02</span><strong>We print it beautifully</strong></div><i>↓</i><div><span>03</span><strong>We send it your way</strong></div></div><div className="card receipt"><div className="price first"><span>Gift code</span><strong className="mono">{code}</strong></div><div className="price"><span>Portrait</span><span className="free">Included</span></div><div className="price"><span>Order status</span><strong>Confirmed ✦</strong></div></div><button className="btn" style={{ height: 52, marginTop: 25, padding: '0 30px' }} onClick={() => setStep('welcome')}>Back to beginning ↗</button></section></main>}
  </div>
}

function Art() { return <div className="art" aria-hidden="true"><div className="sun"/><div className="blob"/><div className="spark s1">✦</div><div className="spark s2">✳</div><div className="face"><div className="hair"/><div className="eye l"/><div className="eye r"/><div className="smile"/><div className="shirt"/></div><div className="artLabel">TOONED / 01</div></div> }
