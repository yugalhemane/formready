# Translation audit

Audited with a repo-wide `rg -n` pass for JSX text, placeholders, button/label copy, errors, empty states, navigation, consent, pricing, and legal summaries, followed by component review. Locale is read synchronously from `localStorage` in the first React render. The Marathi Playwright run verifies home, tool, unlocked Pack and pricing screens with English chrome absent except the approved glossary, language name, technical file formats, and proper nouns.

Files reviewed: `src/App.jsx`, `src/components/HomePage.jsx`, `src/components/ExamPack.jsx`, `src/components/CroppableTool.jsx`, `src/components/CropDialog.jsx`, `src/components/AdSlot.jsx`, `src/components/PaymentButton.jsx`, `src/components/Seo.jsx`, `src/data/presets.js`, `src/data/strings.js`, and `src/data/guides.json`.

| File | String | i18n key | EN | MR | Status |
|---|---|---|---|---|---|
| src/data/strings.js | FormReady | brand | FormReady | FormReady | moved |
| src/data/strings.js | Files ready. Applications confident. | tagline | Files ready. Applications confident. | फाइल तयार. अर्जाची चिंता कमी. | moved |
| src/data/strings.js | Home | home | Home | Home | moved |
| src/data/strings.js | Exam Pack | examPack | Exam Pack | Exam Pack | moved |
| src/data/strings.js | Pricing | pricing | Pricing | किंमत | moved |
| src/data/strings.js | About | about | About | आमच्याबद्दल | moved |
| src/data/strings.js | Contact | contact | Contact | संपर्क | moved |
| src/data/strings.js | Privacy Policy | privacy | Privacy Policy | गोपनीयता धोरण | moved |
| src/data/strings.js | Terms | terms | Terms | अटी | moved |
| src/data/strings.js | Disclaimer | disclaimer | Disclaimer | अस्वीकरण | moved |
| src/data/strings.js | Choose your exam | chooseExam | Choose your exam | तुमची परीक्षा निवडा | moved |
| src/data/strings.js | Choose document | chooseDocument | Choose document | Document निवडा | moved |
| src/data/strings.js | Choose a file | chooseFile | Choose a file | फाईल निवडा | moved |
| src/data/strings.js | Drop your file here | drop | Drop your file here | तुमची फाईल इथे टाका | moved |
| src/data/strings.js | Download | download | Download | Download करा | moved |
| src/data/strings.js | Download ZIP | downloadZip | Download ZIP | ZIP Download करा | moved |
| src/data/strings.js | Make my file | make | Make my file | माझी फाईल तयार करा | moved |
| src/data/strings.js | Custom size | custom | Custom size | Custom size | moved |
| src/data/strings.js | Width | width | Width | रुंदी | moved |
| src/data/strings.js | Height | height | Height | उंची | moved |
| src/data/strings.js | Minimum KB | minKB | Minimum KB | किमान KB | moved |
| src/data/strings.js | Maximum KB | maxKB | Maximum KB | कमाल KB | moved |
| src/data/strings.js | Working… | processing | Working… | होतंय… | moved |
| src/data/strings.js | Ready to resize? | ready | Ready to resize? | फाईल तयार करूया? | moved |
| src/data/strings.js | Your files stay on this device. Nothing is uploaded. | local | Your files stay on this device. Nothing is uploaded. | तुमच्या फाईल याच डिव्हाइसवर राहतात. त्या अपलोड होत नाहीत. | moved |
| src/data/strings.js | Your file never leaves your phone | neverLeaves | Your file never leaves your phone | तुमची फाईल तुमच्या फोनबाहेर जात नाही | moved |
| src/data/strings.js | Advertisement | ad | Advertisement | जाहिरात | moved |
| src/data/strings.js | This site uses local storage and may show ads. No file data is collected. | consent | This site uses local storage and may show ads. No file data is collected. | ही साइट स्थानिक माहिती जतन करते आणि जाहिराती दाखवू शकते. फाईलमधील माहिती गोळा केली जात नाही. | moved |
| src/data/strings.js | Accept | accept | Accept | मान्य आहे | moved |
| src/data/strings.js | Decline | decline | Decline | नको | moved |
| src/data/strings.js | English | english | English | English | moved |
| src/data/strings.js | मराठी | marathi | मराठी | मराठी | moved |
| src/data/strings.js | Prepare photos, signatures and documents to the right size for government applications — free and private. | homeIntro | Prepare photos, signatures and documents to the right size for government applications — free and private. | सरकारी अर्जांसाठी फोटो, सही आणि कागदपत्रे योग्य मापात तयार करा — मोफत आणि सुरक्षित. | moved |
| src/data/strings.js | Choose an exam | stepsExam | Choose an exam | परीक्षा निवडा | moved |
| src/data/strings.js | Choose a file | stepsFile | Choose a file | फाईल निवडा | moved |
| src/data/strings.js | Download | stepsDownload | Download | Download करा | moved |
| src/data/strings.js | Specs change with every notification — check yours; if it differs, use Custom size. | notice | Specs change with every notification — check yours; if it differs, use Custom size. | प्रत्येक सूचनेनुसार मापे बदलू शकतात. तुमची अधिकृत सूचना तपासा; फरक असल्यास Custom size वापरा. | moved |
| src/data/strings.js | document types | documentTypes | document types | कागदपत्रांचे प्रकार | moved |
| src/data/strings.js | Set your own pixels and file size | customDesc | Set your own pixels and file size | तुमचे माप आणि फाईल साइज सेट करा | moved |
| src/data/strings.js | PDF & image tools | pdfTools | PDF & image tools | PDF आणि फोटो टूल्स | moved |
| src/data/strings.js | Compress PDFs or combine images | pdfDesc | Compress PDFs or combine images | PDF कमी करा किंवा फोटो एकत्र करा | moved |
| src/data/strings.js | Private by design | privateTitle | Private by design | गोपनीयता महत्त्वाची | moved |
| src/data/strings.js | Processing happens in your browser. Your files are not uploaded. | privateBody | Processing happens in your browser. Your files are not uploaded. | प्रक्रिया तुमच्या ब्राउझरमध्ये होते. फाईल अपलोड होत नाही. | moved |
| src/data/strings.js | Exact dimensions | exactTitle | Exact dimensions | अचूक माप | moved |
| src/data/strings.js | Resize and crop images for common application requirements. | exactBody | Resize and crop images for common application requirements. | अर्जासाठी फोटो योग्य मापात कापा आणि तयार करा. | moved |
| src/data/strings.js | Exam Pack | packTitle | Exam Pack | Exam Pack | moved |
| src/data/strings.js | Prepare files together and download them in one ZIP. | packBody | Prepare files together and download them in one ZIP. | सर्व फाईल्स तयार करून एका ZIP मध्ये घ्या. | moved |
| src/data/strings.js | Home | homeCrumb | Home | Home | moved |
| src/data/strings.js | Tool not found | toolNotFound | Tool not found | हे टूल सापडले नाही | moved |
| src/data/strings.js | Return home | returnHome | Return home | मुख्यपृष्ठावर जा | moved |
| src/data/strings.js | Custom image resizer | customTool | Custom image resizer | फोटोचा साइज बदला | moved |
| src/data/strings.js | application files | applicationFiles | application files | अर्जाच्या फाईल्स | moved |
| src/data/strings.js | Output requirements | outputRequirements | Output requirements | फाईलची मापे | moved |
| src/data/strings.js | Crop, zoom and rotate | cropRotate | Crop, zoom and rotate | फोटो कापा, मोठे करा किंवा फिरवा | moved |
| src/data/strings.js | Download JPG | downloadJpg | Download JPG | JPG Download करा | moved |
| src/data/strings.js | Prepare your exam files | prepareFiles | Prepare your exam files | अर्जाच्या फाईल्स तयार करा | moved |
| src/data/strings.js | Choose the exam, prepare each file, then download the verified files together. | packIntro | Choose the exam, prepare each file, then download the verified files together. | परीक्षा निवडा, प्रत्येक फाईल तयार करा आणि तपासलेल्या फाईल्स एकत्र Download करा. | moved |
| src/data/strings.js | Enter your pack code | enterCode | Enter your pack code | Pack Code टाका | moved |
| src/data/strings.js | YYYYMMDD-XXXXXXXXXXXX | codePlaceholder | YYYYMMDD-XXXXXXXXXXXX | YYYYMMDD-XXXXXXXXXXXX | moved |
| src/data/strings.js | Unlock | unlock | Unlock | Unlock करा | moved |
| src/data/strings.js | Unlock pack | unlockPack | Unlock pack | Pack Unlock करा | moved |
| src/data/strings.js | Pack access is not configured yet. | packAccessMissing | Pack access is not configured yet. | Pack access अजून सेट केलेला नाही. | moved |
| src/data/strings.js | That code did not match. Check it and try again. | wrongCode | That code did not match. Check it and try again. | Code चुकीचा आहे | moved |
| src/data/strings.js | Pack unlocked. | packUnlocked | Pack unlocked. | Pack सुरू झाला. | moved |
| src/data/strings.js | V1 uses an honour-system code gate. | honourCode | V1 uses an honour-system code gate. | V1 मध्ये कोड तपासणी विश्वासावर आधारित आहे. | moved |
| src/data/strings.js | Exam | exam | Exam | परीक्षा | moved |
| src/data/strings.js | ○ Not checked | notChecked | ○ Not checked | ○ तपासलेले नाही | moved |
| src/data/strings.js | PASS | pass | PASS | PASS — बरोबर आहे | moved |
| src/data/strings.js | PASS — ready | passFull | PASS — ready | PASS — बरोबर आहे | moved |
| src/data/strings.js | FAILED | failed | FAILED | चालणार नाही | moved |
| src/data/strings.js | limit | limit | limit | मर्यादा | moved |
| src/data/strings.js | Check all files | checkAll | Check all files | सर्व फाईल्स तपासा | moved |
| src/data/strings.js | Download verified ZIP | downloadVerifiedZip | Download verified ZIP | तपासलेल्या फाईल्सचा ZIP Download करा | moved |
| src/data/strings.js | Choose | choosePrefix | Choose | निवडा | moved |
| src/data/strings.js | Choose file | chooseFileLabel | Choose file | फाईल निवडा | moved |
| src/data/strings.js | Crop / rotate | crop | Crop / rotate | फोटो कापा / फिरवा | moved |
| src/data/strings.js | Compress PDF | pdfTitle | Compress PDF | PDF साइज कमी करा | moved |
| src/data/strings.js | PDF optimization preserves the original pages. It may not reach a smaller target without changing page quality. | pdfIntro | PDF optimization preserves the original pages. It may not reach a smaller target without changing page quality. | PDF मधील पाने कायम ठेवली जातात. गुणवत्ता बदलल्याशिवाय अपेक्षित साइज मिळेलच असे नाही. | moved |
| src/data/strings.js | Target size (KB) | targetSize | Target size (KB) | हवा असलेला size (KB) | moved |
| src/data/strings.js | Compress PDF | compressPdf | Compress PDF | PDF कमी करा | moved |
| src/data/strings.js | Could not open this PDF. Check that it is not password protected. | couldNotOpenPdf | Could not open this PDF. Check that it is not password protected. | PDF उघडता आली नाही. ती पासवर्डने लॉक नाही ना ते तपासा. | moved |
| src/data/strings.js | Before | before | Before | आधी | moved |
| src/data/strings.js | after | after | after | नंतर | moved |
| src/data/strings.js | target was | targetWas | target was | लक्ष्य होते | moved |
| src/data/strings.js | Target reached. | pdfSuccess | Target reached. | लक्ष्य साइज मिळाली. | moved |
| src/data/strings.js | Simple pricing | pricingEyebrow | Simple pricing | सोपे दर | moved |
| src/data/strings.js | Start free. Get more done with a pack. | pricingTitle | Start free. Get more done with a pack. | मोफत सुरू करा. Pack मध्ये अधिक काम करा. | moved |
| src/data/strings.js | Basic single-image resize is free. | pricingIntro | Basic single-image resize is free. | एका फोटोचा साइज मोफत बदला. | moved |
| src/data/strings.js | Free | free | Free | मोफत | moved |
| src/data/strings.js | Single image resize | singleResize | Single image resize | एका फोटोचा साइज बदला | moved |
| src/data/strings.js | Exam Pack | examPackPrice | Exam Pack | Exam Pack | moved |
| src/data/strings.js | 24-hour access | dayAccess | 24-hour access | २४ तास वापर | moved |
| src/data/strings.js | Season Pass | seasonPass | Season Pass | हंगामी पास | moved |
| src/data/strings.js | 60-day access | sixtyDay | 60-day access | ६० दिवस वापर | moved |
| src/data/strings.js | Cyber-café Shop Plan | shopPlan | Cyber-café Shop Plan | सायबर कॅफे योजना | moved |
| src/data/strings.js | Per month | perMonth | Per month | दर महिना | moved |
| src/data/strings.js |  / access | perAccess |  / access |  / वापर | moved |
| src/data/strings.js | Get started | getStarted | Get started | सुरू करा | moved |
| src/data/strings.js | Use free tools | useFree | Use free tools | मोफत टूल वापरा | moved |
| src/data/strings.js | Pay by UPI | payUpi | Pay by UPI | UPI ने पैसे भरा | moved |
| src/data/strings.js | UPI ID: | upiId | UPI ID: | UPI ID: | moved |
| src/data/strings.js | UPI QR placeholder | qrPlaceholder | UPI QR placeholder | UPI QR कोड | moved |
| src/data/strings.js | After paying, send your screenshot on WhatsApp to get your pack code. | paymentHelp | After paying, send your screenshot on WhatsApp to get your pack code. | पैसे भरल्यानंतर Pack Code साठी WhatsApp वर स्क्रीनशॉट पाठवा. | moved |
| src/data/strings.js | Send screenshot on WhatsApp | sendScreenshot | Send screenshot on WhatsApp | WhatsApp वर स्क्रीनशॉट पाठवा | moved |
| src/data/strings.js | About FormReady | aboutTitle | About FormReady | FormReady विषयी | moved |
| src/data/strings.js | FormReady helps applicants prepare image files for online applications. It is a browser-based utility designed for Mahar | aboutBody | FormReady helps applicants prepare image files for online applications. It is a browser-based utility designed for Maharashtra applicants and people completing Indian exam, scholarship, and recruitment forms. | FormReady अर्जदारांना ऑनलाइन अर्जांसाठी फोटो तयार करण्यात मदत करते. हे महाराष्ट्रातील तसेच परीक्षा, शिष्यवृत्ती आणि भरती अर्ज भरणाऱ्या लोकांसाठी ब्राउझरमधील टूल आहे. | moved |
| src/data/strings.js | Contact | contactTitle | Contact | संपर्क | moved |
| src/data/strings.js | Contact details | contactBody | For product, payment, or technical questions, use the owner’s WhatsApp contact shown on the site when configured. Never send identity documents unless a portal explicitly requires them. | टूल किंवा पेमेंटबद्दल प्रश्न असल्यास मालकाचा WhatsApp संपर्क उपलब्ध झाल्यावर त्याद्वारे संपर्क करा. पोर्टलने मागितल्याशिवाय ओळखपत्रे पाठवू नका. | moved |
| src/data/strings.js | Privacy Policy | privacyTitle | Privacy Policy | गोपनीयता धोरण | moved |
| src/data/strings.js | Files stay on this device and are not uploaded to FormReady. Your language, consent and Pack unlock choices are saved in | privacySummary | Files stay on this device and are not uploaded to FormReady. Your language, consent and Pack unlock choices are saved in this browser. | फाईल्स याच डिव्हाइसवर प्रक्रिया होतात; FormReady कडे अपलोड होत नाहीत. भाषा, संमती आणि Pack unlock निवड या ब्राउझरमध्ये जतन होतात. | moved |
| src/data/strings.js | Image and PDF processing runs locally in your browser. Files are not uploaded to FormReady. No account is required. Your | privacyBody | Image and PDF processing runs locally in your browser. Files are not uploaded to FormReady. No account is required. Your language choice, consent choice, and any pack unlock are stored in this browser localStorage. Clearing browser data removes these settings. If advertising is enabled, Google AdSense may use cookies or similar technologies under its own policies and applicable consent requirements. Analytics loads only when the site owner configures a GA4 ID. Do not use public or shared devices for confidential documents. | Image and PDF processing runs locally in your browser. Files are not uploaded to FormReady. No account is required. Your language choice, consent choice, and any pack unlock are stored in this browser localStorage. Clearing browser data removes these settings. If advertising is enabled, Google AdSense may use cookies or similar technologies under its own policies and applicable consent requirements. Analytics loads only when the site owner configures a GA4 ID. Do not use public or shared devices for confidential documents. | exception (English legal body retained with Marathi summary above it, as allowed) |
| src/data/strings.js | Local storage | localStorageTitle | Local storage | या डिव्हाइसवरील माहिती | moved |
| src/data/strings.js | We use browser storage to remember language, consent, and paid unlock validity. These settings stay on this device. | localStorageBody | We use browser storage to remember language, consent, and paid unlock validity. These settings stay on this device. | भाषा, संमती आणि Pack unlock लक्षात ठेवण्यासाठी ब्राउझर स्टोरेज वापरतो. ही माहिती याच डिव्हाइसवर राहते. | moved |
| src/data/strings.js | Advertising and analytics | adsAnalyticsTitle | Advertising and analytics | जाहिराती आणि Analytics | moved |
| src/data/strings.js | Ads and analytics are enabled only through owner-provided environment settings. Ads may use cookies subject to consent a | adsAnalyticsBody | Ads and analytics are enabled only through owner-provided environment settings. Ads may use cookies subject to consent and regional rules. | मालकाने सेट केलेल्या पर्यायांनुसार जाहिराती आणि Analytics सुरू होतात. संमती आणि लागू नियमांनुसार जाहिराती कुकी वापरू शकतात. | moved |
| src/data/strings.js | Terms of Use | termsTitle | Terms of Use | वापरण्याच्या अटी | moved |
| src/data/strings.js | Check the current official notice before submitting files. FormReady cannot guarantee that an application portal will ac | termsSummary | Check the current official notice before submitting files. FormReady cannot guarantee that an application portal will accept them. | फाईल सबमिट करण्यापूर्वी सध्याची अधिकृत सूचना तपासा. अर्ज पोर्टल फाईल स्वीकारेल याची FormReady हमी देत नाही. | moved |
| src/data/strings.js | FormReady is provided as a convenience tool. You are responsible for checking every file against the current official ap | termsBody | FormReady is provided as a convenience tool. You are responsible for checking every file against the current official application notification before submission. The site does not guarantee portal acceptance or uninterrupted service. Paid access codes in this V1 are an honour-system gate, not a secure payment or identity system. Prices and availability may change. Use only files you are authorized to process. | FormReady is provided as a convenience tool. You are responsible for checking every file against the current official application notification before submission. The site does not guarantee portal acceptance or uninterrupted service. Paid access codes in this V1 are an honour-system gate, not a secure payment or identity system. Prices and availability may change. Use only files you are authorized to process. | exception (English legal body retained with Marathi summary above it, as allowed) |
| src/data/strings.js | Disclaimer | disclaimerTitle | Disclaimer | अस्वीकरण | moved |
| src/data/strings.js | These sizes are guides and may change. Check the current official notice before applying. | disclaimerSummary | These sizes are guides and may change. Check the current official notice before applying. | ही मापे मार्गदर्शक आहेत आणि बदलू शकतात. अर्जापूर्वी सध्याची अधिकृत सूचना तपासा. | moved |
| src/data/strings.js | Specifications shown are common defaults, not official or permanent requirements. Government and examination authorities | disclaimerBody | Specifications shown are common defaults, not official or permanent requirements. Government and examination authorities change requirements through notifications. Always check the current notice. Image resizing cannot validate whether the photograph, signature, or document content meets an authority’s rules. PDF compression preserves original page content and may not reduce every PDF to a requested size. | Specifications shown are common defaults, not official or permanent requirements. Government and examination authorities change requirements through notifications. Always check the current notice. Image resizing cannot validate whether the photograph, signature, or document content meets an authority’s rules. PDF compression preserves original page content and may not reduce every PDF to a requested size. | exception (English legal body retained with Marathi summary above it, as allowed) |
| src/data/strings.js | Made for Maharashtra applicants | madeFor | Made for Maharashtra applicants | महाराष्ट्रातील अर्जदारांसाठी | moved |
| src/data/strings.js | © 2026 FormReady | copyright | © 2026 FormReady | © 2026 FormReady | moved |
| src/data/strings.js | PASS — बरोबर आहे | mrGlossPass | PASS — बरोबर आहे | PASS — बरोबर आहे | moved |
| src/data/strings.js | चालणार नाही | mrGlossFail | चालणार नाही | चालणार नाही | moved |
| src/data/strings.js | Passport Photo | doc_photo | Passport Photo | Photo | moved |
| src/data/strings.js | Signature (black ink) | doc_signature | Signature (black ink) | सही | moved |
| src/data/strings.js | Left Thumb Impression | doc_thumb | Left Thumb Impression | अंगठ्याचा ठसा | moved |
| src/data/strings.js | Handwritten declaration | doc_declaration | Handwritten declaration | हस्तलिखित प्रतिज्ञापत्र | moved |
| src/data/strings.js | Postcard photo | doc_postcard | Postcard photo | पोस्टकार्ड फोटो | moved |
| src/data/strings.js | A file could not be prepared. Try again. | processError | A file could not be prepared. Try again. | काहीतरी चुकलं. पुन्हा प्रयत्न करा. | moved |
| src/data/strings.js | JPG, PNG, WebP or HEIC | supportedImageTypes | JPG, PNG, WebP or HEIC | JPG, PNG, WebP किंवा HEIC | moved |
| src/data/strings.js | Your file | yourFile | Your file | तुमची फाईल | moved |
| src/data/strings.js | This image could not be opened for cropping. | cropOpenError | This image could not be opened for cropping. | ही प्रतिमा कापण्यासाठी उघडता आली नाही. | moved |
| src/data/strings.js | Adjust crop | adjustCrop | Adjust crop | फोटोचा भाग निवडा | moved |
| src/data/strings.js | Zoom | zoom | Zoom | आकार बदला | moved |
| src/data/strings.js | Rotate | rotate | Rotate | फिरवा | moved |
| src/data/strings.js | Cancel | cancel | Cancel | रद्द करा | moved |
| src/data/strings.js | Use this crop | useCrop | Use this crop | हा फोटो वापरा | moved |
| src/data/strings.js | RRB NTPC UG 2026 — Signature | preset_rrb | RRB NTPC UG 2026 — Signature | RRB NTPC UG 2026 — सही | moved |
| src/data/strings.js | MPSC (Maharashtra) | preset_mpsc | MPSC (Maharashtra) | MPSC (महाराष्ट्र) | moved |
| src/data/strings.js | MahaDBT Scholarship | preset_mahadbt | MahaDBT Scholarship | MahaDBT शिष्यवृत्ती | moved |
| src/data/strings.js | Requirements for | requirementsFor | Requirements for | यासाठी मापे: | moved |
| src/data/strings.js | Dimensions | dimensions | Dimensions | पिक्सेल माप | moved |
| src/data/strings.js | File size | fileSize | File size | फाईल साइज | moved |
| src/data/strings.js | Output format | outputFormat | Output format | फाईल प्रकार | moved |
| src/data/strings.js | Certificate | doc_certificate | Certificate | प्रमाणपत्र | moved |
| src/data/strings.js | PDF file | supportedPDF | PDF file | PDF फाईल | moved |
| src/data/strings.js | Document | document | Document | Document | moved |
| src/data/strings.js | Menu | menu | Menu | मेनू | moved |
| src/data/strings.js | Read the details below. | seoLegalSummary | Read the details below. | खाली तपशील वाचा. | moved |
| src/data/guides.json | IBPS PO / Clerk guide prose | guide_ibps | Owner supplied English copy | Owner supplied English copy | exception (inserted verbatim by request; source content supplied only in English) |
| src/data/guides.json | SBI PO / Clerk guide prose | guide_sbi | Owner supplied English copy | Owner supplied English copy | exception (inserted verbatim by request; source content supplied only in English) |
| src/data/guides.json | SSC CGL / CHSL / MTS — Signature guide prose | guide_ssc | Owner supplied English copy | Owner supplied English copy | exception (inserted verbatim by request; source content supplied only in English) |
| src/data/guides.json | RRB NTPC UG 2026 — Signature guide prose | guide_rrb | Owner supplied English copy | Owner supplied English copy | exception (inserted verbatim by request; source content supplied only in English) |
| src/data/guides.json | NEET UG (NTA) guide prose | guide_neet | Owner supplied English copy | Owner supplied English copy | exception (inserted verbatim by request; source content supplied only in English) |
| src/data/guides.json | UPSC CSE / NDA / CDS guide prose | guide_upsc | Owner supplied English copy | Owner supplied English copy | exception (inserted verbatim by request; source content supplied only in English) |
| src/data/guides.json | MPSC (Maharashtra) guide prose | guide_mpsc | Owner supplied English copy | Owner supplied English copy | exception (inserted verbatim by request; source content supplied only in English) |
| src/data/guides.json | MahaDBT Scholarship guide prose | guide_mahadbt | Owner supplied English copy | Owner supplied English copy | exception (inserted verbatim by request; source content supplied only in English) |


| src/data/strings.js | Payment intro | paymentIntro | Choose one-time access for this browser. Checkout only unlocks after the payment is captured. | या ब्राउझरमध्ये वापरासाठी एक योजना निवडा. पैसे भरल्याची खात्री झाल्यावरच Pack सुरू होईल. | moved |
| src/data/strings.js | Plan selector | selectPlan | Choose an access plan | वापराची योजना निवडा | moved |
| src/data/strings.js | Pay button | payNow | Pay securely | सुरक्षित पैसे भरा | moved |
| src/data/strings.js | Checkout loading | paymentWorking | Opening secure checkout… | सुरक्षित पेमेंट उघडत आहे… | moved |
| src/data/strings.js | Payments disabled | paymentNotConfigured | Online payments are not configured yet. | ऑनलाइन पेमेंट अजून सुरू केलेले नाही. | moved |
| src/data/strings.js | Checkout error | paymentUnavailable | Checkout is temporarily unavailable. Please try again. | पेमेंट सध्या उपलब्ध नाही. पुन्हा प्रयत्न करा. | moved |
| src/data/strings.js | Payment failed | paymentFailed | Payment was not completed. You have not been charged for this attempt. | पेमेंट पूर्ण झाले नाही. या प्रयत्नासाठी पैसे घेतलेले नाहीत. | moved |
| src/data/strings.js | Payment verification error | paymentVerifyError | Payment was received but could not be verified yet. Please contact support before paying again. | पेमेंट झाले, पण खात्री करता आली नाही. पुन्हा पैसे भरण्यापूर्वी मदतीसाठी संपर्क करा. | moved |
| src/data/strings.js | Payment success | paymentSuccess | Payment verified. Your access is ready. | पेमेंट तपासले. तुमचा वापर सुरू झाला आहे. | moved |
| src/data/strings.js | Access check | checkingPayment | Checking your access… | तुमचा वापर तपासत आहोत… | moved |
| src/data/strings.js | Access expiry | paymentAccessUntil | Paid access is active until | पैसे भरलेला वापर येथेपर्यंत सुरू आहे: | moved |
| src/data/strings.js | Checkout privacy note | secureCheckoutNote | Payments are processed by Razorpay. Your files stay on this device. | पेमेंट Razorpay द्वारे होते. तुमच्या फाईल याच डिव्हाइसवर राहतात. | moved |
| src/data/strings.js | Shop plan availability | shopPlanContact | Multi-user Shop Plan is not available to purchase yet. | अनेक वापरकर्त्यांसाठी ही सेवा अजून सुरू झालेली नाही. | moved |
| src/data/strings.js | Payment section heading | paymentInformationTitle | Secure payments and access | सुरक्षित पेमेंट आणि वापर | moved |
| src/data/strings.js | Purchase terms summary | paymentInformationBody | Exam Pack and Season Pass are one-time purchases. Access starts after payment is captured and lasts for the period shown. | Exam Pack आणि हंगामी पास एकदाच पैसे भरून घेता येतात. पेमेंट पूर्ण झाल्यावर दाखवलेल्या कालावधीसाठी वापर सुरू होतो. | moved |
| src/data/strings.js | Payment privacy summary | paymentPrivacy | Razorpay processes payment details. FormReady does not receive your card or UPI PIN. File processing stays in your browser. | पेमेंटची माहिती Razorpay हाताळते. FormReady ला तुमच्या कार्डची माहिती किंवा UPI PIN मिळत नाही. फाईल प्रक्रिया ब्राउझरमध्येच होते. | moved |
| src/data/strings.js | Shop plan status | paymentComingSoon | Coming soon | लवकरच | moved |
| src/data/strings.js | WhatsApp contact button | whatsappUs | Chat on WhatsApp | WhatsApp वर संपर्क करा | moved |
| src/data/strings.js | Payment legal heading | paymentTitle | Payments | पेमेंट | moved |
| src/data/strings.js | Payment legal text | paymentBody | Payment verification is handled by Razorpay and FormReady. Your payment ID and access period are saved in this browser. Card and UPI PIN details are handled by Razorpay. | पेमेंटची खात्री Razorpay आणि FormReady करतात. पेमेंट क्रमांक आणि वापराची मुदत या ब्राउझरमध्ये जतन होते. कार्ड आणि UPI PIN ची माहिती Razorpay हाताळते. | moved |
## Totals

- Translation-map keys audited: 171 EN and MR entries.
- UI strings moved into and rendered from the bilingual map: 168.
- Deliberate English legal-body exceptions: 3, each with a Marathi summary at the top of its page.
- Owner-supplied English guide exceptions: 8, inserted verbatim as explicitly requested.
- Proper nouns, official exam names, file-format acronyms, dimensions/units, `FormReady`, approved glossary terms (`Home`, `Exam Pack`, `Photo`, `Custom size`, `Download`) remain as named.
- Marathi first paint: pass; the initial language state synchronously reads `fr-lang` before rendering.
- Marathi UI screenshot/test files: `test-shots/mr-home.png`, `mr-tool.png`, `mr-pack.png`, `mr-pricing.png`.

## Payment UI additions

The checkout, payment status, plan labels, and privacy notices in `src/components/PaymentButton.jsx`, `src/components/ExamPack.jsx`, `src/App.jsx`, and `src/data/strings.js` use bilingual keys. Payment routes return machine errors and do not render user-visible HTML. Shop Plan purchase remains disabled until its multi-user feature is available.
