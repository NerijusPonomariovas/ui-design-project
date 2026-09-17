// Objektas visiems anketės duomenims saugoti
const anketosDuomenys = {};
let currentSection = 1;
const totalSections = 5;

// Inicializacija kai puslapis užkrautas
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('gimimoData').setAttribute('max', new Date().toISOString().split('T')[0]);
    document.getElementById('telefonas').setAttribute('maxlength', '15'); // +370 6XX XXXXX
    document.getElementById('telefonas').addEventListener('input', formatTelefonas);
    document.getElementById('gimimoData').addEventListener('change', generateAsmensKodas);
    document.getElementById('lytis').addEventListener('change', generateAsmensKodas);
    document.getElementById('issilavinimas').addEventListener('change', e => handleIssimokslinimas(e.target.value));
    document.getElementById('vedybinePadetis').addEventListener('change', e => handleVedybinePadetis(e.target.value));
    document.getElementById('profPadetis').addEventListener('change', e => handleProfesionePadetis(e.target.value));
    document.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('blur', function() { validateField(this); });
    });
    updateProgress();
});

function formatTelefonas(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.startsWith('370')) {
        let formatted = '+370';
        if (value.length > 3) {
            formatted += ' ' + value.substring(3, 6);
        }
        if (value.length > 6) {
            formatted += ' ' + value.substring(6, 11);
        }
        e.target.value = formatted;
    } else {
        e.target.value = value;
    }
}

// Asmens kodo generavimas
function generateAsmensKodas() {
    const gimimoData = document.getElementById('gimimoData').value;
    const lytis = document.getElementById('lytis').value;
    
    if (gimimoData && lytis) {
        const data = new Date(gimimoData);
        const metai = data.getFullYear();
        const century = Math.floor((metai - 1800) / 100);
        const pirmas = century * 2 + (lytis === 'vyras' ? 1 : 2);
        
        // Automatiškai užpildoma dalis: pirmas skaitmuo + metai + mėnuo + diena (7 skaitmenys)
        const automatineDalis = pirmas + String(metai).substring(2) + String(data.getMonth() + 1).padStart(2, '0') + String(data.getDate()).padStart(2, '0');
        
        // Likusis kodas su keturiais tuščiais (XXX eilės tvarkos + C kontrolinis)
        document.getElementById('asmensKodas').value = automatineDalis + '____';
        document.getElementById('asmensKodas').placeholder = automatineDalis + 'XXXC';
        document.getElementById('asmensKodas').maxLength = '11';
        
        // Amžius
        const siandien = new Date();
        let amzius = siandien.getFullYear() - metai;
        if (siandien.getMonth() < data.getMonth() || (siandien.getMonth() === data.getMonth() && siandien.getDate() < data.getDate())) {
            amzius--;
        }
        anketosDuomenys.amzius = amzius;
    }
}

// Išsilavinimo tvarka
function handleIssimokslinimas(value) {
    const duomenysBlokas = document.getElementById('issimokslinimoDuomenys');
    const laipsnioGrupe = document.getElementById('moksloLaipsnisGroup');
    const laipsnioSelect = document.getElementById('moksloLaipsnis');
    
    if (value && value !== 'pagrindinis') {
        duomenysBlokas.style.display = 'block';
        setFieldRequired('mokykla', true);
        setFieldRequired('baigimoMetai', true);
        setFieldRequired('kvalifikacija', true);
        
        if (value === 'aukstasis-kolegijinis') {
            laipsnioGrupe.style.display = 'block';
            laipsnioSelect.innerHTML = '<option value="">Pasirinkite</option><option value="profesinis-bakalauras">Profesinis bakalauras</option>';
            setFieldRequired('moksloLaipsnis', true);
        } else if (value === 'aukstasis-universitetinis') {
            laipsnioGrupe.style.display = 'block';
            laipsnioSelect.innerHTML = '<option value="">Pasirinkite</option><option value="bakalauras">Bakalauras</option><option value="magistras">Magistras</option><option value="daktaras">Mokslų daktaras</option>';
            setFieldRequired('moksloLaipsnis', true);
        } else {
            laipsnioGrupe.style.display = 'none';
            setFieldRequired('moksloLaipsnis', false);
        }
    } else {
        duomenysBlokas.style.display = 'none';
        laipsnioGrupe.style.display = 'none';
        ['mokykla', 'baigimoMetai', 'kvalifikacija', 'moksloLaipsnis'].forEach(f => setFieldRequired(f, false));
    }
}

// Vedybinės padėties tvarka
function handleVedybinePadetis(value) {
    const sutuoktinioDuomenys = document.getElementById('sutuoktinioDuomenys');
    const hint = document.getElementById('vedybineHint');
    const amzius = anketosDuomenys.amzius;
    
    hint.style.display = 'none';
    if (amzius && amzius < 16) {
        hint.style.display = 'block';
        hint.style.color = '#e74c3c';
        hint.textContent = 'Dėmesio: esate jaunesnis nei minimalus santuokai leidžiamas amžius (16 m.)';
    } else if (amzius && amzius >= 16 && amzius < 18) {
        hint.style.display = 'block';
        hint.style.color = '#f39c12';
        hint.textContent = 'Santuokai leidžiamas amžius – 18 m., ribiniu atveju – nuo 16 m.';
    }
    
    const vedusiIstekejusi = value === 'vedęs/ištekėjusi';
    sutuoktinioDuomenys.style.display = vedusiIstekejusi ? 'block' : 'none';
    setFieldRequired('sutuoktinioVardas', vedusiIstekejusi);
    setFieldRequired('sutuoktinioPavarde', vedusiIstekejusi);
}

// Profesinės padėties tvarka
function handleProfesionePadetis(value) {
    const blokai = {
        'studijuoja': ['studijuojaDuomenys', ['studijuPakopa', 'kursas', 'studijuIstaiga', 'tiketiniBaigimoMetai']],
        'dirba': ['dirbaDuomenys', ['darboIstaiga', 'pareigos']],
        'nedirba': ['nedirbaDuomenys', ['nedarboPriezastis']],
        'motinystės/tėvystės atostogose': ['atostogoseDuomenys', ['atostoguPabaiga']]
    };
    
    ['studijuojaDuomenys', 'dirbaDuomenys', 'nedirbaDuomenys', 'atostogoseDuomenys'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    
    ['studijuPakopa', 'kursas', 'studijuIstaiga', 'tiketiniBaigimoMetai', 'darboIstaiga', 
     'pareigos', 'nedarboPriezastis', 'atostoguPabaiga'].forEach(f => setFieldRequired(f, false));
    
    if (blokai[value]) {
        document.getElementById(blokai[value][0]).style.display = 'block';
        blokai[value][1].forEach(f => setFieldRequired(f, true));
    }
}

// Nustatyti lauką kaip privalomą
function setFieldRequired(fieldId, required) {
    const field = document.getElementById(fieldId);
    if (field) {
        required ? field.setAttribute('required', 'required') : (field.removeAttribute('required'), field.value = '');
    }
}

// Lauko validacija
function validateField(field) {
    const value = field.value.trim();
    removeErrorMessage(field);
    field.classList.remove('error');
    
    if (field.hasAttribute('required') && !value) {
        return showError(field, 'Šis laukas yra privalomas'), false;
    }
    
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return showError(field, 'Neteisingas el. pašto formato'), false;
    }
    
    if (field.id === 'telefonas' && value && !/^\+370\s6\d{2}\s\d{5}$/.test(value)) {
        return showError(field, 'Neteisingas telefono formato. Pavyzdys: +370 6XX XXXXX'), false;
    }
    
    if (field.id === 'asmensKodas' && value && (value.length !== 11 || !/^\d+$/.test(value))) {
        return showError(field, 'Asmens kodas turi būti 11 skaitmenų'), false;
    }
    
    return true;
}

// Rodyti klaidą
function showError(field, message) {
    field.classList.add('error', 'shake');
    const errorDiv = document.createElement('span');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
    setTimeout(() => field.classList.remove('shake'), 400);
}

// Pašalinti klaidos pranešimą
function removeErrorMessage(field) {
    const error = field.parentNode.querySelector('.error-message');
    if (error) error.remove();
}

// Validuoti sekciją
function validateSection(sectionNumber) {
    const section = document.getElementById(`section${sectionNumber}`);
    const inputs = section.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    inputs.forEach(input => {
        if (input.offsetParent !== null && !validateField(input)) isValid = false;
    });
    return isValid;
}

// Sekanti sekcija
function nextSection(num) {
    if (!validateSection(num)) return;
    saveSectionData(num);
    if (num < totalSections) {
        document.getElementById(`section${num}`).classList.remove('active');
        document.getElementById(`section${num + 1}`).classList.add('active');
        currentSection = num + 1;
        updateProgress();
        window.scrollTo(0, 0);
    }
}

// Ankstesnė sekcija
function prevSection(num) {
    if (num > 1) {
        document.getElementById(`section${num}`).classList.remove('active');
        document.getElementById(`section${num - 1}`).classList.add('active');
        currentSection = num - 1;
        updateProgress();
        window.scrollTo(0, 0);
    }
}

// Išsaugoti sekcijos duomenis
function saveSectionData(num) {
    const section = document.getElementById(`section${num}`);
    section.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.id) {
            anketosDuomenys[input.id] = input.type === 'number' ? (input.value ? parseInt(input.value) : null) : input.value;
        }
    });
}

// Atnaujinti progresą
function updateProgress() {
    const progress = ((currentSection - 1) / totalSections) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressText').textContent = `Užpildyta: ${Math.round(progress)}%`;
}

// Pateikti formą
function submitForm() {
    if (validateSection(5)) {
        saveSectionData(5);
        displayResults();
    }
}

// Rodyti rezultatus
function displayResults() {
    const d = anketosDuomenys;
    let html = '';
    
    const addData = (title, data) => `<div class="duomenu-kategorija"><h3>${title}</h3>${data}</div>`;
    const addRow = (label, value) => value ? `<div class="duomenu-eilute"><div class="duomenu-pavadinimas">${label}:</div><div class="duomenu-reiksme">${value}</div></div>` : '';
    
    const issMap = {'pagrindinis':'Pagrindinis','vidurinis':'Vidurinis','profesinis':'Profesinis','aukstasis-kolegijinis':'Aukštasis kolegijinis','aukstasis-universitetinis':'Aukštasis universitetinis'};
    const laipsnisMap = {'profesinis-bakalauras':'Profesinis bakalauras','bakalauras':'Bakalauras','magistras':'Magistras','daktaras':'Mokslų daktaras'};
    
    // Pagrindiniai
    html += addData('Pagrindiniai duomenys', 
        addRow('Lytis', d.lytis) + addRow('Vardas', d.vardas) + addRow('Antrasis vardas', d.antrasVardas) + 
        addRow('Pavardė', d.pavarde) + addRow('Gimimo data', d.gimimoData) + addRow('Amžius', d.amzius + ' m.') + 
        addRow('Asmens kodas', d.asmensKodas));
    
    // Išsilavinimas
    html += addData('Išsilavinimas', 
        addRow('Išsilavinimas', issMap[d.issilavinimas]) + addRow('Mokslo įstaiga', d.mokykla) + 
        addRow('Baigimo metai', d.baigimoMetai) + addRow('Kvalifikacija', d.kvalifikacija) + 
        addRow('Mokslo laipsnis', laipsnisMap[d.moksloLaipsnis]));
    
    // Kontaktiniai
    html += addData('Kontaktiniai duomenys', 
        addRow('Telefonas', d.telefonas) + addRow('El. paštas', d.epastas) + addRow('Adresas', d.adresas));
    
    // Šeiminė
    html += addData('Šeiminė padėtis', 
        addRow('Vedybinė padėtis', d.vedybinePadetis) + 
        (d.sutuoktinioVardas ? addRow('Sutuoktinis(-ė)', d.sutuoktinioVardas + ' ' + d.sutuoktinioPavarde) : ''));
    
    // Profesinė
    let profHtml = addRow('Profesinė padėtis', d.profPadetis);
    if (d.profPadetis === 'studijuoja') {
        profHtml += addRow('Studijų pakopa', d.studijuPakopa) + addRow('Kursas', d.kursas) + 
                    addRow('Studijų įstaiga', d.studijuIstaiga) + addRow('Tikėtini baigimo metai', d.tiketiniBaigimoMetai);
    } else if (d.profPadetis === 'dirba') {
        profHtml += addRow('Darbo įstaiga', d.darboIstaiga) + addRow('Pareigos', d.pareigos);
    } else if (d.profPadetis === 'nedirba') {
        profHtml += addRow('Nedarbo priežastis', d.nedarboPriezastis);
    } else if (d.profPadetis === 'motinystės/tėvystės atostogose') {
        profHtml += addRow('Atostogų pabaiga', d.atostoguPabaiga);
    }
    profHtml += addRow('Darbo patirtis', d.darboPatirtis + ' m.') + addRow('Darbo sritis', d.darboSritis);
    html += addData('Profesinė veikla', profHtml);
    
    document.getElementById('rezultatuTurinys').innerHTML = html;
    document.getElementById('anketaForm').style.display = 'none';
    document.getElementById('rezultatai').style.display = 'block';
    document.getElementById('progressBar').style.width = '100%';
    document.getElementById('progressText').textContent = 'Užpildyta: 100%';
    console.log('Anketės duomenys:', d);
}

// Atstatyti formą
function resetForm() {
    Object.keys(anketosDuomenys).forEach(key => delete anketosDuomenys[key]);
    document.getElementById('anketaForm').reset();
    
    for (let i = 1; i <= totalSections; i++) {
        document.getElementById(`section${i}`).classList.remove('active');
    }
    document.getElementById('section1').classList.add('active');
    currentSection = 1;
    
    ['issimokslinimoDuomenys', 'moksloLaipsnisGroup', 'sutuoktinioDuomenys', 
     'studijuojaDuomenys', 'dirbaDuomenys', 'nedirbaDuomenys', 'atostogoseDuomenys']
     .forEach(id => document.getElementById(id).style.display = 'none');
    
    document.getElementById('anketaForm').style.display = 'block';
    document.getElementById('rezultatai').style.display = 'none';
    updateProgress();
    window.scrollTo(0, 0);
}
