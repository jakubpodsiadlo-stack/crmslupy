import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

/** Tryb osadzony (np. panel CRM): pełny kalkulator bez zapisu pod 6-cyfrowym kodem / first_lead. */
const KALKULATOR_NO_CODE =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('noCode') === '1';

let infraCounter = 0;
const SUPABASE_TABLE = 'calculator_codes';
let supabaseClient = null;

function getHandlowiecDigitInputs() {
    return [0, 1, 2, 3].map((i) => document.getElementById(`sales-agent-code-d${i}`)).filter(Boolean);
}

function getSalesAgentPhoneInputEl() {
    return document.getElementById('sales-agent-phone');
}

function getHandlowiecCodeString() {
    return getHandlowiecDigitInputs()
        .map((el) => String(el.value || '').replace(/\D/g, '').slice(-1))
        .join('')
        .slice(0, 4);
}

function setHandlowiecCodeString(code) {
    const digits = String(code || '').replace(/\D/g, '').slice(0, 4);
    const inputs = getHandlowiecDigitInputs();
    for (let i = 0; i < 4; i++) {
        if (inputs[i]) inputs[i].value = digits[i] || '';
    }
}

function normalizePhoneDigits(value) {
    return String(value || '').replace(/\D/g, '');
}

function applyHandlowiecRestoreFromStan(stan) {
    const nr = (stan?.salesAgentNumber || stan?.dbRecord?.nr_handlowca || '').trim();
    if (nr) setHandlowiecCodeString(nr);
    const phoneEl = getSalesAgentPhoneInputEl();
    if (phoneEl) {
        const ph =
            stan?.salesAgentPhone != null && String(stan.salesAgentPhone).trim() !== ''
                ? String(stan.salesAgentPhone)
                : (stan?.dbRecord?.telefon_handlowca != null ? String(stan.dbRecord.telefon_handlowca) : '');
        phoneEl.value = ph;
    }
}

function initHandlowiecCodeField() {
    const inputs = getHandlowiecDigitInputs();
    const phoneEl = getSalesAgentPhoneInputEl();
    if (!inputs.length) return;
    const klient = pobierzSupabaseClient();
    if (!klient) {
        inputs.forEach((el) => {
            el.disabled = true;
        });
        if (phoneEl) {
            phoneEl.disabled = true;
            phoneEl.placeholder = '— Supabase —';
        }
        return;
    }
    inputs.forEach((el) => {
        el.disabled = false;
    });
    if (phoneEl) {
        phoneEl.disabled = false;
        phoneEl.placeholder = 'np. 500 600 700';
    }

    const onDigitsPaste = (e) => {
        const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
        const d = text.replace(/\D/g, '').slice(0, 4);
        if (d.length >= 2) {
            e.preventDefault();
            setHandlowiecCodeString(d);
            const idx = Math.min(d.length, 3);
            inputs[idx]?.focus();
        }
    };

    inputs.forEach((input, idx) => {
        if (input.dataset.handlowiecDigitBound) return;
        input.dataset.handlowiecDigitBound = '1';
        input.addEventListener('paste', onDigitsPaste);
        input.addEventListener('input', () => {
            const raw = String(input.value || '').replace(/\D/g, '');
            if (raw.length > 1) {
                setHandlowiecCodeString(raw);
                const focusAt = Math.min(raw.length, 3);
                inputs[focusAt]?.focus();
                return;
            }
            input.value = raw.slice(-1);
            if (raw && idx < 3) inputs[idx + 1]?.focus();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && idx > 0) {
                inputs[idx - 1].focus();
                inputs[idx - 1].value = '';
            }
        });
    });
}

    function dodajInfrastrukture(type) {
        infraCounter++;
        const container = document.getElementById('infra-container');
        const div = document.createElement('div');
        div.className = 'infra-item';
        div.id = `infra-${infraCounter}`;
        div.dataset.type = type; 
        
        let config = { title: "", icon: "", color: "", options: "", maSlupy: false, maSluzebnosc: false, maPosadowienie: false, maOcenaPradu: false, maOcenaGazu: false, coeffLabel: "Współczynnik K" };

        if(type === 'E') {
            config = { title: "Energia Elektryczna", icon: "⚡", color: "#2563eb", maSlupy: true, maSluzebnosc: true, maPosadowienie: true, maOcenaPradu: true, maOcenaGazu: false, coeffLabel: "Współczynnik K (Prąd)",
                options: `
                    <option value="3">Słup niskiego napięcia</option>
                    <option value="5.2">Słup średniego napięcia</option>
                    <option value="7.1">Słup wysokiego napięcia</option>
                    <option value="7.2">Stacja energetyczna</option>`};
        } else if(type === 'G') {
            config = { title: "Gazociąg", icon: "🔥", color: "#0ea5e9", maSluzebnosc: true, maPosadowienie: true, maOcenaGazu: true, maOcenaPradu: false, coeffLabel: "Współczynnik K (Gaz)",
                options: `
                    <option value="12">Gazociąg 40 cm </option>
                    <option value="16">Gazociąg 40 - 60 cm </option>
                    <option value="20">Gazociąg powyżej 60 cm </option>`};
        } else {
            return;
        }

        const poleSlupowHTML = config.maSlupy ? `
        <div>
            <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 5px; text-transform: uppercase;">Ilość słupów</label>
            <input type="number" class="item-slupy" value="0" min="0" step="1" style="width: 100%; box-sizing: border-box;" oninput="aktualizujSekcjeSlupa(${infraCounter}); przelicz()">
        </div>` : "";

        const poleDetaliSlupaHTML = config.maSlupy ? `
        <div class="item-slup-details" style="display:none; border: 1px solid rgba(147, 197, 253, 0.45); background: rgba(219, 234, 254, 0.45); border-radius: 12px; padding: 10px;">
            <div style="display: grid; gap: 8px;">
                <div>
                    <div class="item-slup-kafelki"></div>
                    <input type="hidden" class="item-slup-rodzaj" value="">
                </div>
            </div>
        </div>` : "";

        const polaSluzebnosciHTML = config.maSluzebnosc ? `
        <div>
            <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 5px; text-transform: uppercase;">${config.coeffLabel}</label>
            <input type="number" class="item-sluzebnosc-number" value="0" min="0" step="1" style="width: 100%; box-sizing: border-box;">
        </div>` : "";

        const polePosadowieniaHTML = config.maPosadowienie ? `
        <div>
            <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 6px; text-transform: uppercase;">Służebność</label>
            <div class="posadowienie-toggle">
                <button type="button" class="posadowienie-btn active" data-value="NAZIEMNA" onclick="ustawPosadowienie(${infraCounter}, 'NAZIEMNA')">Nadziemne</button>
                <button type="button" class="posadowienie-btn" data-value="PODZIEMNA" onclick="ustawPosadowienie(${infraCounter}, 'PODZIEMNA')">Podziemne</button>
            </div>
            <input type="hidden" class="item-posadowienie" value="NAZIEMNA">
        </div>` : "";

        const poleOcenyPraduHTML = config.maOcenaPradu ? `
        <div>
            <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 5px; text-transform: uppercase;">Ocena prądu</label>
            <select class="item-prad-ocena" onchange="synchronizujOcenePraduZLiczba(${infraCounter})"></select>
        </div>` : "";

        const poleOcenyGazuHTML = config.maOcenaGazu ? `
        <div>
            <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 5px; text-transform: uppercase;">Ocena gazu</label>
            <select class="item-gaz-ocena" onchange="synchronizujOceneGazuZLiczba(${infraCounter})"></select>
        </div>` : "";

        div.innerHTML = `
            <button class="btn-remove" onclick="usunInfrastrukture(${infraCounter})">−</button>
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 15px; text-align: center;">
                <span style="font-size: 16px;">${config.icon}</span>
                <div class="item-name" style="font-size: 11px; color: ${config.color}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${config.title}</div>
            </div>
            <div style="margin-bottom: 12px;">
                <label style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Rodzaj infrastruktury</label>
                <select class="item-subtype" onchange="aktualizujSzerokosc(this, ${infraCounter})">${config.options}</select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr; gap: 15px; align-items: end;">
        <div>
            <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 5px; text-transform: uppercase;">Długość (m)</label>
            <input type="number" class="item-len" value="10" style="width: 100%; box-sizing: border-box;" oninput="przelicz()">
        </div>
        ${polePosadowieniaHTML}
        ${poleOcenyPraduHTML}
        ${poleOcenyGazuHTML}
        ${poleSlupowHTML}
        ${poleDetaliSlupaHTML}
        ${polaSluzebnosciHTML}
    </div>
            <input type="hidden" class="item-width" value="">
        `;
        container.appendChild(div);
        if (config.maOcenaPradu) aktualizujOcenePradu(infraCounter);
        if (config.maOcenaGazu) aktualizujOceneGazu(infraCounter);
        if (config.maSlupy) aktualizujSekcjeSlupa(infraCounter);
        if (config.maSlupy) odswiezKafelkiRodzajuSlupa(infraCounter);
        aktualizujSzerokosc(div.querySelector('.item-subtype'), infraCounter);
        przelicz();
        
        div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function usunInfrastrukture(id) {
        const el = document.getElementById(`infra-${id}`);
        if(el) el.remove();
        przelicz();
    }

    function aktualizujSzerokosc(selectElement, id) {
        const parent = document.getElementById(`infra-${id}`);
        const widthInput = parent.querySelector('.item-width');
        widthInput.value = selectElement.value;
        przelicz();
    }

    function aktualizujSekcjeSlupa(id) {
        const parent = document.getElementById(`infra-${id}`);
        if (!parent) return;
        const slupyInput = parent.querySelector('.item-slupy');
        const details = parent.querySelector('.item-slup-details');
        if (!slupyInput || !details) return;
        const iloscSlupow = parseFloat(slupyInput.value) || 0;
        details.style.display = iloscSlupow > 0 ? 'block' : 'none';
    }

    function pobierzGrafikeSlupaDataUri(rodzajRaw) {
        const rodzaj = String(rodzajRaw || '').trim() || 'Słup';
        const svgByType = {
            'Żelbetowy': `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 160'><defs><linearGradient id='sky1' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#eef6ff'/><stop offset='100%' stop-color='#dbeafe'/></linearGradient><linearGradient id='concrete' x1='0' y1='0' x2='1' y2='0'><stop offset='0%' stop-color='#8794a8'/><stop offset='50%' stop-color='#a5b0c2'/><stop offset='100%' stop-color='#7b879a'/></linearGradient></defs><rect width='320' height='160' fill='url(#sky1)'/><rect x='0' y='126' width='320' height='34' fill='#dbe6f6'/><rect x='146' y='18' width='28' height='116' rx='7' fill='url(#concrete)'/><rect x='90' y='35' width='140' height='9' rx='4' fill='#55667f'/><line x1='160' y1='44' x2='86' y2='80' stroke='#8b99ad' stroke-width='2.5'/><line x1='160' y1='44' x2='234' y2='80' stroke='#8b99ad' stroke-width='2.5'/><circle cx='86' cy='80' r='3.2' fill='#1d4ed8'/><circle cx='234' cy='80' r='3.2' fill='#1d4ed8'/><rect x='146' y='86' width='28' height='3' fill='#6b778c' opacity='0.5'/><rect x='146' y='102' width='28' height='3' fill='#6b778c' opacity='0.4'/></svg>`,
            'Kratowy': `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 160'><defs><linearGradient id='sky2' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#edf5ff'/><stop offset='100%' stop-color='#d9e9ff'/></linearGradient><linearGradient id='steel' x1='0' y1='0' x2='1' y2='0'><stop offset='0%' stop-color='#4f5f76'/><stop offset='50%' stop-color='#70829a'/><stop offset='100%' stop-color='#4a5a71'/></linearGradient></defs><rect width='320' height='160' fill='url(#sky2)'/><rect x='0' y='126' width='320' height='34' fill='#d4e2f4'/><polygon points='160,20 130,134 190,134' fill='none' stroke='url(#steel)' stroke-width='4'/><line x1='133' y1='124' x2='187' y2='124' stroke='#6d7f98' stroke-width='2.5'/><line x1='136' y1='109' x2='184' y2='109' stroke='#6d7f98' stroke-width='2.5'/><line x1='139' y1='94' x2='181' y2='94' stroke='#6d7f98' stroke-width='2.5'/><line x1='142' y1='79' x2='178' y2='79' stroke='#6d7f98' stroke-width='2.5'/><line x1='146' y1='64' x2='174' y2='64' stroke='#6d7f98' stroke-width='2.5'/><line x1='149' y1='49' x2='171' y2='49' stroke='#6d7f98' stroke-width='2.5'/><rect x='102' y='36' width='116' height='8' rx='4' fill='#55667f'/></svg>`,
            'Drewniany': `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 160'><defs><linearGradient id='sky3' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#f2f8ff'/><stop offset='100%' stop-color='#deebff'/></linearGradient><linearGradient id='wood2' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#c7863f'/><stop offset='50%' stop-color='#a86624'/><stop offset='100%' stop-color='#88501a'/></linearGradient></defs><rect width='320' height='160' fill='url(#sky3)'/><rect x='0' y='126' width='320' height='34' fill='#d8e6f8'/><rect x='147' y='17' width='26' height='118' rx='8' fill='url(#wood2)'/><rect x='96' y='35' width='128' height='10' rx='5' fill='#9f6022'/><line x1='154' y1='24' x2='154' y2='132' stroke='#dca067' stroke-width='1.5' opacity='0.7'/><line x1='160' y1='24' x2='160' y2='132' stroke='#6f3f13' stroke-width='1' opacity='0.35'/><line x1='166' y1='24' x2='166' y2='132' stroke='#dca067' stroke-width='1.4' opacity='0.65'/><line x1='160' y1='45' x2='90' y2='76' stroke='#a56a2b' stroke-width='2.2'/><line x1='160' y1='45' x2='230' y2='76' stroke='#a56a2b' stroke-width='2.2'/></svg>`,
            'Stacja': `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 160'><defs><linearGradient id='sky4' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#edf5ff'/><stop offset='100%' stop-color='#d9e8ff'/></linearGradient><linearGradient id='box' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#8ea1bc'/><stop offset='100%' stop-color='#6c809d'/></linearGradient></defs><rect width='320' height='160' fill='url(#sky4)'/><rect x='0' y='126' width='320' height='34' fill='#d5e3f5'/><rect x='104' y='46' width='112' height='76' rx='9' fill='url(#box)'/><rect x='118' y='60' width='30' height='26' rx='3' fill='#e6edf7'/><rect x='172' y='60' width='30' height='26' rx='3' fill='#e6edf7'/><rect x='148' y='92' width='24' height='20' rx='3' fill='#c7d3e3'/><line x1='160' y1='46' x2='160' y2='24' stroke='#4e6078' stroke-width='4'/><line x1='130' y1='46' x2='130' y2='32' stroke='#4e6078' stroke-width='3'/><line x1='190' y1='46' x2='190' y2='32' stroke='#4e6078' stroke-width='3'/><circle cx='160' cy='22' r='3.8' fill='#1d4ed8'/><rect x='112' y='52' width='96' height='2' fill='#5d718d' opacity='0.5'/></svg>`
        };
        const svg = svgByType[rodzaj] || `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 160'><rect width='320' height='160' fill='#eef6ff'/><text x='160' y='82' text-anchor='middle' font-family='Arial' font-size='18' fill='#1e3a8a'>Wybierz rodzaj słupa</text><text x='160' y='106' text-anchor='middle' font-family='Arial' font-size='13' fill='#475569'>aby zobaczyć podgląd</text></svg>`;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    function pobierzDostepneRodzajeSlupa() {
        return ['Żelbetowy', 'Kratowy', 'Drewniany', 'Stacja'];
    }

    function odswiezKafelkiRodzajuSlupa(id) {
        const parent = document.getElementById(`infra-${id}`);
        if (!parent) return;
        const kontener = parent.querySelector('.item-slup-kafelki');
        const hidden = parent.querySelector('.item-slup-rodzaj');
        if (!kontener || !hidden) return;
        const obecny = String(hidden.value || '');
        const rodzaje = pobierzDostepneRodzajeSlupa();

        kontener.innerHTML = rodzaje.map((rodzaj) => {
            const isActive = obecny === rodzaj ? ' active' : '';
            return `<button type="button" class="slup-tile${isActive}" onclick="ustawRodzajSlupa(${id}, '${rodzaj.replace(/'/g, "\\'")}')">
                <img src="${pobierzGrafikeSlupaDataUri(rodzaj)}" alt="${rodzaj}" />
                <span>${rodzaj}</span>
            </button>`;
        }).join('');
    }

    function ustawRodzajSlupa(id, rodzaj) {
        const parent = document.getElementById(`infra-${id}`);
        if (!parent) return;
        const hidden = parent.querySelector('.item-slup-rodzaj');
        if (hidden) hidden.value = rodzaj || '';
        odswiezKafelkiRodzajuSlupa(id);
        przelicz();
    }

    function ustawPosadowienie(id, wartosc) {
        const parent = document.getElementById(`infra-${id}`);
        if (!parent) return;
        const hidden = parent.querySelector('.item-posadowienie');
        if (hidden) hidden.value = wartosc;
        parent.querySelectorAll('.posadowienie-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.value === wartosc);
        });
        if ((parent.dataset.type || 'E') === 'E') {
            aktualizujOcenePradu(id);
        }
        if ((parent.dataset.type || 'E') === 'G') {
            aktualizujOceneGazu(id);
        }
    }

    function pobierzOpcjeOcenyPradu(posadowienie) {
        if (posadowienie === 'PODZIEMNA') {
            return [
                { value: '0.1', label: 'Prąd OK (0,1)' },
                { value: '0.2', label: 'Prąd średnio (0,2)' },
                { value: '0.3', label: 'Prąd lipa (0,3)' }
            ];
        }
        return [
            { value: '0.1', label: 'Prąd OK (0,1)' },
            { value: '0.2', label: 'Prąd wsm dalej OK (0,2)' },
            { value: '0.3', label: 'Prąd średnio (0,3)' },
            { value: '0.4', label: 'Prąd lipa (0,4)' },
            { value: '0.5', label: 'Prąd mega lipa (0,5)' }
        ];
    }

    function aktualizujOcenePradu(id, preferowanaWartosc = null) {
        const parent = document.getElementById(`infra-${id}`);
        if (!parent || (parent.dataset.type || 'E') !== 'E') return;
        const select = parent.querySelector('.item-prad-ocena');
        if (!select) return;
        const posadowienie = parent.querySelector('.item-posadowienie')?.value || 'NAZIEMNA';
        const options = pobierzOpcjeOcenyPradu(posadowienie);
        const zachowana = preferowanaWartosc ?? select.value;

        select.innerHTML = options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('');
        const istnieje = options.some((opt) => opt.value === String(zachowana));
        select.value = istnieje ? String(zachowana) : options[0].value;
        synchronizujOcenePraduZLiczba(id);
    }

    function synchronizujOcenePraduZLiczba(id) {
        const parent = document.getElementById(`infra-${id}`);
        if (!parent) return;
        const select = parent.querySelector('.item-prad-ocena');
        const sluzebnoscNumber = parent.querySelector('.item-sluzebnosc-number');
        if (!select || !sluzebnoscNumber) return;
        sluzebnoscNumber.value = select.value;
        przelicz();
    }

    function pobierzOpcjeOcenyGazu(posadowienie) {
        if (posadowienie === 'PODZIEMNA') {
            return [
                { value: '0.1', label: 'Gaz OK (0,1)' },
                { value: '0.2', label: 'Gaz średnio (0,2)' },
                { value: '0.3', label: 'Gaz lipa (0,3)' }
            ];
        }
        return [
            { value: '0.1', label: 'Gaz OK (0,1)' },
            { value: '0.2', label: 'Gaz wsm dalej OK (0,2)' },
            { value: '0.3', label: 'Gaz średnio (0,3)' },
            { value: '0.4', label: 'Gaz lipa (0,4)' },
            { value: '0.5', label: 'Gaz mega lipa (0,5)' }
        ];
    }

    function aktualizujOceneGazu(id, preferowanaWartosc = null) {
        const parent = document.getElementById(`infra-${id}`);
        if (!parent || (parent.dataset.type || 'E') !== 'G') return;
        const select = parent.querySelector('.item-gaz-ocena');
        if (!select) return;
        const posadowienie = parent.querySelector('.item-posadowienie')?.value || 'NAZIEMNA';
        const options = pobierzOpcjeOcenyGazu(posadowienie);
        const zachowana = preferowanaWartosc ?? select.value;

        select.innerHTML = options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('');
        const istnieje = options.some((opt) => opt.value === String(zachowana));
        select.value = istnieje ? String(zachowana) : options[0].value;
        synchronizujOceneGazuZLiczba(id);
    }

    function synchronizujOceneGazuZLiczba(id) {
        const parent = document.getElementById(`infra-${id}`);
        if (!parent) return;
        const select = parent.querySelector('.item-gaz-ocena');
        const sluzebnoscNumber = parent.querySelector('.item-sluzebnosc-number');
        if (!select || !sluzebnoscNumber) return;
        sluzebnoscNumber.value = select.value;
        przelicz();
    }

    function mapujRodzajDzialki(zabudowaRaw) {
        if (!zabudowaRaw) return "";
        const val = String(zabudowaRaw).toUpperCase();
        if (val.includes("WIELORODZIN")) return "MIESZKANIOWA_WIELORODZINNA";
        if (val.includes("JEDNORODZIN")) return "MIESZKANIOWA_JEDNORODZINNA";
        if (val.includes("MIESZKANIOWA")) return "MIESZKANIOWA_JEDNORODZINNA";
        if (val.includes("BUDOWLANA")) return "MIESZKANIOWA_JEDNORODZINNA";
        if (val.includes("MIESZK") || val.includes("BUDOW")) return "MIESZKANIOWA_JEDNORODZINNA";
        if (val.includes("ROLNA") || val.includes("ROLN")) return "ROLNA_LESNA";
        if (val.includes("LESNA") || val.includes("LEŚNA") || val.includes("LESN")) return "ROLNA_LESNA";
        if (val.includes("USLUG") || val.includes("USŁUG")) return "USLUGI";
        if (val.includes("INWEST") || val.includes("INWESTYCYJNA") || val.includes("KOMERC")) return "USLUGI";
        return "";
    }

    function mapujLinieEnergetyczna(liniaRaw) {
        if (!liniaRaw) return "";
        const val = String(liniaRaw).toUpperCase();
        if (val.includes("NN") || val.includes("NISK")) return "3";
        if (val.includes("SN") || val.includes("SREDN") || val.includes("ŚREDN")) return "5.2";
        if (val.includes("WN") || val.includes("WYSOK")) return "7.1";
        if (val.includes("STAC")) return "7.2";
        return "";
    }

    function pobierzDlugoscSlupaZRodzaju(rodzajRaw) {
        const map = {
            // Zmniejszone wartości długości dla znacznie mniejszego wpływu na wycenę.
            'Drewniany': 2,
            'Żelbetowy': 2.5,
            'Kratowy': 4,
            'Stacja': 5
        };
        return map[String(rodzajRaw || '').trim()] ?? 2;
    }

    function ustawRodzajDzialkiZListy(zabudowaRaw) {
        if (!zabudowaRaw) return false;
        const select = document.getElementById('parcel-type-select');
        if (!select) return false;

        const mapped = mapujRodzajDzialki(zabudowaRaw);
        if (mapped) {
            const opcja = Array.from(select.options).find((opt) => String(opt.value).toUpperCase() === mapped);
            if (opcja) {
                select.value = opcja.value;
                return true;
            }
        }
        return false;
    }

    function scalDaneBota(base, nowy) {
        if (nowy.cena !== null && nowy.cena !== undefined && nowy.cena !== "") base.cena = nowy.cena;
        if (nowy.zabudowa) base.zabudowa = nowy.zabudowa;
        if (nowy.liniaEnergetyczna) base.liniaEnergetyczna = nowy.liniaEnergetyczna;
        return base;
    }

    function wyciagnijDaneZTekstu(tekst) {
        const wynik = { cena: null, zabudowa: null, liniaEnergetyczna: null };
        if (!tekst || typeof tekst !== "string") return wynik;
        const upperTekst = tekst.toUpperCase();

        const cenaMatch = tekst.match(/(?:cena|warto(?:ść|sc)\s*gruntu)\s*(?:to)?\s*:?\s*([0-9]+(?:[.,][0-9]+)?)/i);
        if (cenaMatch) wynik.cena = cenaMatch[1];

        const zabudowaMatch = tekst.match(/rodzaj\s+zabudowy[^\n\r:]*:\s*([^\n\r.]+)/i);
        if (zabudowaMatch) wynik.zabudowa = zabudowaMatch[1].trim();

        const liniaMatch = tekst.match(/(?:linie?\s+energetyczne?|linia\s+energetyczna)[^\n\r:]*:\s*([^\n\r.]+)/i);
        if (liniaMatch) wynik.liniaEnergetyczna = liniaMatch[1].trim();

        // Twardy fallback: wykrycie enumów w całym tekście.
        if (!wynik.zabudowa) {
            if (/\bMIESZKANIOWA\b/.test(upperTekst)) wynik.zabudowa = "MIESZKANIOWA";
            else if (/\bROLNA\b/.test(upperTekst)) wynik.zabudowa = "ROLNA";
            else if (/\bLESNA\b|\bLEŚNA\b/.test(upperTekst)) wynik.zabudowa = "LESNA";
            else if (/\bINWESTYCYJNA\b/.test(upperTekst)) wynik.zabudowa = "INWESTYCYJNA";
            else if (/\bBUDOWLANA\b/.test(upperTekst)) wynik.zabudowa = "MIESZKANIOWA";
        }

        if (!wynik.liniaEnergetyczna) {
            if (/\bNN\b/.test(upperTekst)) wynik.liniaEnergetyczna = "NN";
            else if (/\bSN\b/.test(upperTekst)) wynik.liniaEnergetyczna = "SN";
            else if (/\bWN\b/.test(upperTekst)) wynik.liniaEnergetyczna = "WN";
            else if (/\bSTACJA\b/.test(upperTekst)) wynik.liniaEnergetyczna = "STACJA";
        }

        if (!wynik.zabudowa) {
            const enumZabudowy = tekst.match(/\b(MIESZKANIOWA|ROLNA|LESNA|LEŚNA|INWESTYCYJNA|BUDOWLANA)\b/i);
            if (enumZabudowy) wynik.zabudowa = enumZabudowy[1];
        }

        if (!wynik.liniaEnergetyczna) {
            const enumLinii = tekst.match(/\b(NN|SN|WN|STACJA)\b/i);
            if (enumLinii) wynik.liniaEnergetyczna = enumLinii[1];
        }

        return wynik;
    }

    function wyciagnijDaneZPayload(payload) {
        const wynik = { cena: null, zabudowa: null, liniaEnergetyczna: null };
        if (!payload) return wynik;

        if (typeof payload === "string") {
            return wyciagnijDaneZTekstu(payload);
        }
        if (typeof payload !== "object") return wynik;

        const zrodloCeny = payload.cena ?? payload.price ?? payload.wartosc_gruntu ?? payload.wartoscGruntu ?? payload.cena_dzialki;
        if (zrodloCeny !== undefined && zrodloCeny !== null && zrodloCeny !== "") wynik.cena = zrodloCeny;

        const zrodloZabudowy = payload.zabudowa ?? payload.rodzaj_dzialki ?? payload.rodzajDzialki ?? payload.mpzp ?? payload.parcel_type;
        if (zrodloZabudowy) wynik.zabudowa = zrodloZabudowy;

        const zrodloLinii = payload.linia_energetyczna ?? payload.liniaEnergetyczna ?? payload.linia ?? payload.rodzaj_linii;
        if (zrodloLinii) wynik.liniaEnergetyczna = zrodloLinii;

        if (typeof payload.text === "string") {
            const tekst = payload.text;
            const jsonMatch = tekst.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    scalDaneBota(wynik, wyciagnijDaneZPayload(parsed));
                } catch (_) {}
            }
            scalDaneBota(wynik, wyciagnijDaneZTekstu(tekst));
        }

        return wynik;
    }

    function wyciagnijDaneZEventu(event) {
        const wynik = { cena: null, zabudowa: null, liniaEnergetyczna: null };
        const odwiedzone = new WeakSet();
        const kolejka = [event];
        let kroki = 0;

        while (kolejka.length && kroki < 200) {
            kroki++;
            const node = kolejka.shift();
            if (node === null || node === undefined) continue;

            if (typeof node === "string") {
                scalDaneBota(wynik, wyciagnijDaneZTekstu(node));
                continue;
            }

            if (typeof node === "object") {
                if (odwiedzone.has(node)) continue;
                odwiedzone.add(node);
                scalDaneBota(wynik, wyciagnijDaneZPayload(node));

                Object.values(node).forEach((v) => {
                    if (typeof v === "string" || (v && typeof v === "object")) kolejka.push(v);
                });
            }
        }

        return wynik;
    }

    function czySaDaneBota(dane) {
        return dane && (dane.cena !== null || dane.zabudowa !== null || dane.liniaEnergetyczna !== null);
    }

    function zastosujDaneBota(dane) {
        let czyZmiana = false;

        if (dane.cena !== null) {
            const liczba = parseFloat(String(dane.cena).replace(",", "."));
            if (!Number.isNaN(liczba)) {
                document.getElementById('in-price').value = liczba;
                czyZmiana = true;
            }
        }

        if (ustawRodzajDzialkiZListy(dane.zabudowa)) czyZmiana = true;

        const mappedLinia = mapujLinieEnergetyczna(dane.liniaEnergetyczna);
        if (mappedLinia) {
            const selectEnergia = document.querySelector('.infra-item[data-type="E"] .item-subtype');
            if (selectEnergia) {
                selectEnergia.value = mappedLinia;
                const kontener = selectEnergia.closest('.infra-item');
                const id = kontener ? parseInt(kontener.id.split('-')[1], 10) : NaN;
                if (!Number.isNaN(id)) aktualizujSzerokosc(selectEnergia, id);
                czyZmiana = true;
            }
        }

        if (czyZmiana) przelicz();
    }

    function pobierzSupabaseClient() {
        if (supabaseClient) return supabaseClient;
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return supabaseClient;
    }

    function odswiezTrybZapisuUI() {
        if (KALKULATOR_NO_CODE) return;
        const czySupabase = !!pobierzSupabaseClient();
        const komunikat = czySupabase
            ? ''
            : 'Brak konfiguracji Supabase. Ustaw VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY w pliku .env (npm run dev / npm run build).';
        ustawStatus('code-save-status', komunikat, false);
        initHandlowiecCodeField();
    }

    function czyBrakWiersza(error) {
        if (!error) return false;
        return error.code === 'PGRST116' || String(error.message || '').toLowerCase().includes('no rows');
    }

    function tekstBleduSupabase(err) {
        if (!err) return 'Nieznany błąd.';
        const base = err.message || String(err);
        const parts = [base];
        if (err.code) parts.push(`kod: ${err.code}`);
        if (err.details) parts.push(err.details);
        if (err.hint) parts.push(err.hint);
        return parts.filter(Boolean).join(' — ');
    }

    async function czyKodIstniejeWSupabase(kod) {
        const klient = pobierzSupabaseClient();
        if (!klient) return false;
        const { data, error } = await klient
            .from(SUPABASE_TABLE)
            .select('code')
            .eq('code', kod)
            .maybeSingle();

        if (error && !czyBrakWiersza(error)) throw error;
        return !!data;
    }

    async function generujUnikalnyKod() {
        const klient = pobierzSupabaseClient();
        if (!klient) return null;
        for (let i = 0; i < 60; i++) {
            const kod = String(Math.floor(100000 + Math.random() * 900000));
            const istnieje = await czyKodIstniejeWSupabase(kod);
            if (!istnieje) return kod;
        }
        return null;
    }

    async function zapiszStanPoKodzie(kod, stan) {
        const klient = pobierzSupabaseClient();
        if (!klient) throw new Error('SUPABASE_NOT_CONFIGURED');
        const rekord = stan.dbRecord || {};
        const { error } = await klient.from(SUPABASE_TABLE).upsert(
            {
                code: kod,
                payload: stan,
                client_id: rekord.id_klienta || null,
                sales_agent_name: rekord.imie_i_nazwisko_handlowca || null,
                sales_agent_number: rekord.nr_handlowca || null,
                parcel_type: rekord.rodzaj_dzialki || null,
                land_value: rekord.wartosc_dzialki_zl_m2 ?? null,
                pole_type: rekord.rodzaj_slupa || null,
                pole_length_m: rekord.dlugosc_slupa_m ?? null,
                area_m2: rekord.ilosc_m2 ?? null,
                pole_count: rekord.ilosc_slupow ?? null,
                gas_length_m: rekord.dlugosc_gazociagu_m ?? null,
                gas_type: rekord.rodzaj_gazociagu || null,
                gas_m2: rekord.m2_gazociagu ?? null,
                total_price_from: rekord.cena_calkowita_od ?? null,
                total_price_to: rekord.cena_calkowita_do ?? null,
                power_price_from: rekord.cena_za_prad_od ?? null,
                power_price_to: rekord.cena_za_prad_do ?? null,
                gas_price_from: rekord.cena_za_gaz_od ?? null,
                gas_price_to: rekord.cena_za_gaz_do ?? null,
                updated_at: new Date().toISOString()
            },
            { onConflict: 'code' }
        );
        if (error) throw error;
    }

    async function zarejestrujFirstLeadDlaKodu(kod, salesAgentName) {
        const klient = pobierzSupabaseClient();
        if (!klient) throw new Error('SUPABASE_NOT_CONFIGURED');
        const { error } = await klient.rpc('calculator_register_first_lead', {
            p_code: kod,
            p_sales_agent_name: (salesAgentName || '').trim() || null,
        });
        if (error) throw error;
    }

    async function pobierzStanPoKodzie(kod) {
        const klient = pobierzSupabaseClient();
        if (!klient) throw new Error('SUPABASE_NOT_CONFIGURED');
        const { data, error } = await klient
            .from(SUPABASE_TABLE)
            .select('payload')
            .eq('code', kod)
            .maybeSingle();

        if (error && !czyBrakWiersza(error)) throw error;
        return data ? data.payload : null;
    }

    function zbierzStanKalkulatora(clientId = null, agent = null) {
        const parcelType = document.getElementById('parcel-type-select').value;
        const price = parseFloat(document.getElementById('in-price').value) || 0;
        const phoneFromDom = String(getSalesAgentPhoneInputEl()?.value || '').trim();
        const ag = agent || {
            name: '',
            number: getHandlowiecCodeString(),
            id: null,
        };
        const salesAgentName = String(ag.name || '').trim();
        const salesAgentNumber = String(ag.number || '').replace(/\D/g, '').slice(0, 4);
        const salesAgentId = ag.id ?? null;
        const salesAgentPhone = phoneFromDom;
        const infra = Array.from(document.querySelectorAll('.infra-item')).map((item) => {
            const subtype = item.querySelector('.item-subtype');
            const len = item.querySelector('.item-len');
            const slupy = item.querySelector('.item-slupy');
            const sluzebnoscNumber = item.querySelector('.item-sluzebnosc-number');
            const posadowienie = item.querySelector('.item-posadowienie');
            const pradOcena = item.querySelector('.item-prad-ocena');
            const gazOcena = item.querySelector('.item-gaz-ocena');
            const slupRodzaj = item.querySelector('.item-slup-rodzaj');
            const subtypeLabel = subtype ? subtype.options[subtype.selectedIndex]?.text || '' : '';
            return {
                type: item.dataset.type || 'E',
                subtype: subtype ? subtype.value : '',
                subtypeLabel,
                len: len ? (parseFloat(len.value) || 0) : 0,
                slupy: slupy ? (parseInt(slupy.value, 10) || 0) : 0,
                posadowienie: posadowienie ? String(posadowienie.value || 'NAZIEMNA') : 'NAZIEMNA',
                pradOcena: pradOcena ? String(pradOcena.value || '') : '',
                gazOcena: gazOcena ? String(gazOcena.value || '') : '',
                sluzebnoscNumber: sluzebnoscNumber ? (parseFloat(sluzebnoscNumber.value) || 0) : 0,
                slupRodzaj: slupRodzaj ? String(slupRodzaj.value || '') : ''
            };
        });

        const dbRecord = zbudujRekordDoBazy(
            clientId,
            parcelType,
            price,
            infra,
            salesAgentName,
            salesAgentNumber,
            salesAgentPhone
        );

        return {
            clientId,
            salesAgentId,
            salesAgentName,
            salesAgentNumber,
            salesAgentPhone,
            parcelType,
            price,
            infra,
            dbRecord,
            savedAt: new Date().toISOString()
        };
    }

    function odtworzStanKalkulatora(stan) {
        const parcelSelect = document.getElementById('parcel-type-select');
        const priceInput = document.getElementById('in-price');
        if (parcelSelect && stan.parcelType) {
            const mappedParcelType = mapujRodzajDzialki(stan.parcelType) || stan.parcelType;
            parcelSelect.value = mappedParcelType;
        }
        if (priceInput && Number.isFinite(stan.price)) priceInput.value = stan.price;
        applyHandlowiecRestoreFromStan(stan);

        const container = document.getElementById('infra-container');
        container.innerHTML = '';
        infraCounter = 0;

        const lista = Array.isArray(stan.infra) ? stan.infra : [];
        lista.forEach((pozycja) => {
            const type = pozycja?.type || 'E';
            if (type !== 'E' && type !== 'G') return;
            dodajInfrastrukture(type);
            const element = document.getElementById(`infra-${infraCounter}`);
            if (!element) return;

            const subtype = element.querySelector('.item-subtype');
            if (subtype && pozycja.subtype) {
                const czyIstnieje = Array.from(subtype.options).some((opcja) => opcja.value === pozycja.subtype);
                if (czyIstnieje) subtype.value = pozycja.subtype;
            }

            const len = element.querySelector('.item-len');
            if (len && Number.isFinite(pozycja.len)) len.value = pozycja.len;

            const slupy = element.querySelector('.item-slupy');
            if (slupy && Number.isFinite(pozycja.slupy)) slupy.value = pozycja.slupy;
            aktualizujSekcjeSlupa(infraCounter);

            if (pozycja.posadowienie === 'PODZIEMNA') {
                ustawPosadowienie(infraCounter, 'PODZIEMNA');
            } else {
                ustawPosadowienie(infraCounter, 'NAZIEMNA');
            }

            if (type === 'E') {
                const preferowanaOcena = pozycja.pradOcena ?? (Number.isFinite(pozycja.sluzebnoscNumber) ? String(pozycja.sluzebnoscNumber) : null);
                aktualizujOcenePradu(infraCounter, preferowanaOcena);
            }
            if (type === 'G') {
                const preferowanaOcena = pozycja.gazOcena ?? (Number.isFinite(pozycja.sluzebnoscNumber) ? String(pozycja.sluzebnoscNumber) : null);
                aktualizujOceneGazu(infraCounter, preferowanaOcena);
            }

            const sluzebnoscNumber = element.querySelector('.item-sluzebnosc-number');
            if (sluzebnoscNumber && Number.isFinite(pozycja.sluzebnoscNumber)) {
                sluzebnoscNumber.value = pozycja.sluzebnoscNumber;
            }

            const slupRodzaj = element.querySelector('.item-slup-rodzaj');
            if (slupRodzaj && pozycja.slupRodzaj) {
                slupRodzaj.value = pozycja.slupRodzaj;
            }
            odswiezKafelkiRodzajuSlupa(infraCounter);

            aktualizujSzerokosc(subtype, infraCounter);
        });

        przelicz();
    }

    function ustawStatus(idElementu, tekst, czyBlad = false) {
        const element = document.getElementById(idElementu);
        if (!element) return;
        element.textContent = tekst || '';
        element.style.color = czyBlad ? '#b91c1c' : 'var(--text-muted)';
    }

    function przelaczZakladkeKalkulatora(tab) {
        const isWynik = tab === 'wynik';
        const paneParam = document.getElementById('calc-tab-pane-parametry');
        const paneWynik = document.getElementById('calc-tab-pane-wynik');
        const btnParam = document.getElementById('calc-tab-btn-parametry');
        const btnWynik = document.getElementById('calc-tab-btn-wynik');

        if (paneParam) paneParam.classList.toggle('active', !isWynik);
        if (paneWynik) paneWynik.classList.toggle('active', isWynik);
        if (btnParam) btnParam.classList.toggle('active', !isWynik);
        if (btnWynik) btnWynik.classList.toggle('active', isWynik);
    }

    function obliczWynikiKalkulatora() {
        const cenaZaMetr = parseFloat(document.getElementById('in-price').value) || 0;
        const parcelType = document.getElementById('parcel-type-select').value;
        const rateByParcelType = {
            ROLNA_LESNA: 0.05,
            MIESZKANIOWA_JEDNORODZINNA: 0.06,
            MIESZKANIOWA_WIELORODZINNA: 0.08,
            USLUGI: 0.085
        };
        const kapitalizacjaRoczna = rateByParcelType[parcelType] ?? 0.06;
        const kapitalizacjaLata = 6;
        const kapitalizacjaZlozona = Math.pow(1 + kapitalizacjaRoczna, kapitalizacjaLata);
        const wspolczynnikDlaPolaSlupa = 1;

        const sumyTypow = {
            E: { wartosc: 0, dlugosc: 0, m2: 0, slupy: 0, rodzaje: [] },
            G: { wartosc: 0, dlugosc: 0, m2: 0, slupy: 0, rodzaje: [] }
        };

        let totalCombined = 0;
        let breakdownTotalHTML = '';

        document.querySelectorAll('.infra-item').forEach((item) => {
            const dlugoscInfrastruktury = parseFloat(item.querySelector('.item-len').value) || 0;
            const szerokoscInfrastruktury = parseFloat(item.querySelector('.item-width').value) || 0;
            const poleSlupow = item.querySelector('.item-slupy');
            const liczbaSlupow = poleSlupow ? (parseFloat(poleSlupow.value) || 0) : 0;
            const rodzajSlupa = item.querySelector('.item-slup-rodzaj')?.value || '';
            const dlugoscSlupa = pobierzDlugoscSlupaZRodzaju(rodzajSlupa);
            const itemName = item.querySelector('.item-name').innerText;
            const metryKwInfrastruktury = dlugoscInfrastruktury * szerokoscInfrastruktury;
            const typ = item.dataset.type || 'E';
            const subtypeElement = item.querySelector('.item-subtype');
            const subtypeLabel = subtypeElement ? subtypeElement.options[subtypeElement.selectedIndex]?.text || '' : '';
            const wspolczynnikK = parseFloat(item.querySelector('.item-sluzebnosc-number')?.value) || 0;
            const poleSlupa = typ === 'E' ? (liczbaSlupow * szerokoscInfrastruktury * dlugoscSlupa) : 0;
            const metrazBezSlupa = Math.max(0, metryKwInfrastruktury - poleSlupa);
            let kwotaPrzeszlosc = 0;
            let kwotaPrzyszlosc = 0;

            if (typ === 'E') {
                // Kapitalizacja 6 lat wstecz: dzisiejsza wartość zdyskontowana o (1+r)^6.
                kwotaPrzeszlosc =
                    (metrazBezSlupa * cenaZaMetr * wspolczynnikK) / kapitalizacjaZlozona +
                    (poleSlupa * cenaZaMetr * wspolczynnikDlaPolaSlupa) / kapitalizacjaZlozona;
                kwotaPrzyszlosc =
                    (metrazBezSlupa * cenaZaMetr * wspolczynnikK) +
                    (poleSlupa * cenaZaMetr * wspolczynnikDlaPolaSlupa);
            } else {
                // Gaz (linia): kapitalizacja 6 lat wstecz.
                kwotaPrzeszlosc = (dlugoscInfrastruktury * cenaZaMetr * wspolczynnikK) / kapitalizacjaZlozona;
                kwotaPrzyszlosc = dlugoscInfrastruktury * cenaZaMetr * wspolczynnikK;
            }

            const itemCombinedValue = kwotaPrzeszlosc + kwotaPrzyszlosc;
            const itemMin = Math.round(itemCombinedValue * 0.8).toLocaleString();
            const itemMax = Math.round(itemCombinedValue * 1.2).toLocaleString();
            breakdownTotalHTML += `<div class="breakdown-item"><span>${itemName}</span><b>${itemMin} - ${itemMax} PLN</b></div>`;

            totalCombined += itemCombinedValue;
            if (sumyTypow[typ]) {
                const bucket = sumyTypow[typ];
                bucket.wartosc += itemCombinedValue;
                bucket.dlugosc += dlugoscInfrastruktury;
                bucket.m2 += metryKwInfrastruktury;
                bucket.slupy += liczbaSlupow;
                if (subtypeLabel) bucket.rodzaje.push(subtypeLabel.trim());
            }
        });

        return { totalCombined, breakdownTotalHTML, sumyTypow };
    }

    function zakresOdDo(wartosc) {
        return {
            od: Math.round(wartosc * 0.8),
            do: Math.round(wartosc * 1.2)
        };
    }

    function listaUnikalnaTekstow(lista) {
        return Array.from(new Set((lista || []).filter(Boolean))).join(', ');
    }

    function zbudujRekordDoBazy(
        clientId,
        parcelType,
        price,
        infra,
        salesAgentName,
        salesAgentNumber,
        salesAgentPhone
    ) {
        const wyniki = obliczWynikiKalkulatora();
        const e = wyniki.sumyTypow.E;
        const g = wyniki.sumyTypow.G;
        const totalRange = zakresOdDo(wyniki.totalCombined);
        const energiaRange = zakresOdDo(e.wartosc);
        const gazRange = zakresOdDo(g.wartosc);
        const maGaz = g.dlugosc > 0 || (g.rodzaje && g.rodzaje.length > 0);

        return {
            id_klienta: clientId || null,
            imie_i_nazwisko_handlowca: salesAgentName || null,
            nr_handlowca: salesAgentNumber || null,
            telefon_handlowca: salesAgentPhone ? String(salesAgentPhone).trim() || null : null,
            rodzaj_dzialki: parcelType,
            wartosc_dzialki_zl_m2: price,
            rodzaj_slupa: listaUnikalnaTekstow(e.rodzaje),
            dlugosc_slupa_m: Number(e.dlugosc.toFixed(2)),
            ilosc_m2: Number(e.m2.toFixed(2)),
            ilosc_slupow: Number(e.slupy.toFixed(2)),
            dlugosc_gazociagu_m: maGaz ? Number(g.dlugosc.toFixed(2)) : null,
            rodzaj_gazociagu: maGaz ? listaUnikalnaTekstow(g.rodzaje) : null,
            m2_gazociagu: maGaz ? Number(g.m2.toFixed(2)) : null,
            cena_calkowita_od: totalRange.od,
            cena_calkowita_do: totalRange.do,
            cena_za_prad_od: energiaRange.od,
            cena_za_prad_do: energiaRange.do,
            cena_za_gaz_od: maGaz ? gazRange.od : null,
            cena_za_gaz_do: maGaz ? gazRange.do : null,
            infra_pozycje: infra
        };
    }

    async function zapiszWynikPodKodem() {
        const klient = pobierzSupabaseClient();
        if (!klient) {
            ustawStatus('code-save-status', 'Brak konfiguracji Supabase. Uzupełnij .env (VITE_SUPABASE_*).', true);
            return;
        }
        const code = getHandlowiecCodeString();
        const phoneRaw = String(getSalesAgentPhoneInputEl()?.value || '').trim();
        const phoneDigits = normalizePhoneDigits(phoneRaw);
        if (!/^\d{4}$/.test(code)) {
            ustawStatus('code-save-status', 'Uzupełnij czterocyfrowy kod handlowca.', true);
            return;
        }
        if (phoneDigits.length < 9) {
            ustawStatus('code-save-status', 'Podaj numer telefonu (min. 9 cyfr).', true);
            return;
        }
        let resolved;
        try {
            const { data, error } = await klient.rpc('resolve_handlowiec_by_code_for_calculator', {
                p_code: code,
            });
            if (error) throw error;
            const row = Array.isArray(data) && data[0];
            if (!row || !String(row.full_name || '').trim()) {
                ustawStatus('code-save-status', 'Nie znaleziono handlowca z tym kodem.', true);
                return;
            }
            const profilePhoneDigits = normalizePhoneDigits(row.phone || '');
            if (profilePhoneDigits && profilePhoneDigits !== phoneDigits) {
                ustawStatus('code-save-status', 'Numer telefonu nie zgadza się z profilem handlowca.', true);
                return;
            }
            resolved = { id: row.id, name: String(row.full_name).trim(), number: code };
        } catch (e) {
            console.error('[kalkulator] resolve_handlowiec_by_code_for_calculator', e);
            ustawStatus('code-save-status', `Sprawdzenie kodu: ${tekstBleduSupabase(e)}`, true);
            return;
        }

        ustawStatus('code-save-status', 'Zapisywanie...', false);
        let kod;
        try {
            kod = await generujUnikalnyKod();
        } catch (error) {
            console.error('generujUnikalnyKod:', error);
            ustawStatus('code-save-status', `Błąd przy sprawdzaniu kodu: ${tekstBleduSupabase(error)}`, true);
            return;
        }
        if (!kod) {
            ustawStatus('code-save-status', 'Nie udało się wygenerować unikalnego kodu (limit prób).', true);
            return;
        }

        const stan = zbierzStanKalkulatora(null, resolved);
        try {
            await zapiszStanPoKodzie(kod, stan);
        } catch (error) {
            console.error('calculator_codes upsert:', error);
            ustawStatus(
                'code-save-status',
                `Błąd zapisu (calculator_codes): ${tekstBleduSupabase(error)}`,
                true
            );
            return;
        }

        try {
            await zarejestrujFirstLeadDlaKodu(kod, stan.salesAgentName);
        } catch (leadErr) {
            console.error('[kalkulator] first_lead', leadErr);
            document.getElementById('generated-code').textContent = kod;
            ustawStatus(
                'code-save-status',
                `Kod zapisany w kalkulatorze, ale wpis infolinii (first_lead) się nie utworzył: ${tekstBleduSupabase(leadErr)}. Uruchom migrację calculator_register_first_lead w Supabase.`,
                true
            );
            return;
        }

        document.getElementById('generated-code').textContent = kod;
        ustawStatus(
            'code-save-status',
            'Kod zapisany; utworzono wpis na liście infolinii (first_lead). Zachowaj kod, aby wrócić do wyników.',
            false
        );
    }

    let nasluchBotaPodpiety = false;
    let nasluchPostMessagePodpiety = false;
    let nasluchGotowosciBotaPodpiety = false;

    function pobierzApiBota() {
        if (window.botpress && typeof window.botpress.on === "function") return window.botpress;
        if (window.botpressWebChat && typeof window.botpressWebChat.on === "function") return window.botpressWebChat;
        return null;
    }

    function obsluzDowolnyEventBota(event) {
        const dane = wyciagnijDaneZEventu(event);
        if (czySaDaneBota(dane)) zastosujDaneBota(dane);
    }

    function podlaczNasluchBota() {
        if (nasluchBotaPodpiety) return true;
        const apiBota = pobierzApiBota();
        if (!apiBota) return false;

        const eventy = ['message', 'MESSAGE_RECEIVED', 'webchat:message', 'message:received'];
        eventy.forEach((nazwaEventu) => {
            try {
                apiBota.on(nazwaEventu, (event) => {
                    try {
                        obsluzDowolnyEventBota(event);
                    } catch (e) {
                        console.log("Błąd integracji Botpress.");
                    }
                });
            } catch (_) {}
        });

        nasluchBotaPodpiety = true;
        return true;
    }

    function podlaczNasluchPostMessage() {
        if (nasluchPostMessagePodpiety) return;
        window.addEventListener('message', (event) => {
            try {
                obsluzDowolnyEventBota(event && event.data ? event.data : event);
            } catch (_) {}
        });
        nasluchPostMessagePodpiety = true;
    }

    function podlaczNasluchGotowosciBota() {
        if (nasluchGotowosciBotaPodpiety) return;
        window.addEventListener('botpress:ready', () => { podlaczNasluchBota(); });
        window.addEventListener('bp:ready', () => { podlaczNasluchBota(); });
        nasluchGotowosciBotaPodpiety = true;
    }

    let obserwatorTekstuBotaPodpiety = false;
    function podlaczObserwatorTekstuBota() {
        if (obserwatorTekstuBotaPodpiety) return;
        const wzorzec = /(analiza zako|rodzaj zabudowy|linie energetyczne|cena to|zł\/m²)/i;
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    const txt = (node && node.textContent ? String(node.textContent) : "").trim();
                    if (!txt || txt.length < 20 || !wzorzec.test(txt)) return;
                    const dane = wyciagnijDaneZTekstu(txt);
                    if (czySaDaneBota(dane)) zastosujDaneBota(dane);
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        obserwatorTekstuBotaPodpiety = true;
    }

    function podlaczPrzyciskPelnegoEkranuMapy() {
        const btn = document.getElementById('map-fullscreen-btn');
        const geoView = document.getElementById('geoportal-view');
        if (!btn || !geoView) return;

        const odswiezEtykiete = () => {
            const active = document.fullscreenElement === geoView;
            btn.textContent = active ? 'Zamknij pełny ekran' : 'Otwórz na cały ekran';
        };

        btn.addEventListener('click', async () => {
            try {
                if (document.fullscreenElement === geoView) {
                    await document.exitFullscreen();
                } else {
                    await geoView.requestFullscreen();
                }
            } catch (err) {
                console.error('fullscreen mapy:', err);
            } finally {
                odswiezEtykiete();
            }
        });

        document.addEventListener('fullscreenchange', odswiezEtykiete);
        odswiezEtykiete();
    }

    function przelicz() {
        const kontenerInfrastruktury = document.getElementById('infra-container');
        const liczbaElementow = document.querySelectorAll('.infra-item').length;
        kontenerInfrastruktury.classList.toggle('trzy-kafelki', liczbaElementow === 3);
        const wyniki = obliczWynikiKalkulatora();
        document.getElementById('breakdown-total').innerHTML = wyniki.breakdownTotalHTML;
        document.getElementById('range-total').innerText = `${Math.round(wyniki.totalCombined * 0.8).toLocaleString()} - ${Math.round(wyniki.totalCombined * 1.2).toLocaleString()} PLN`;

    }

    globalThis.dodajInfrastrukture = dodajInfrastrukture;
    globalThis.usunInfrastrukture = usunInfrastrukture;
    globalThis.aktualizujSzerokosc = aktualizujSzerokosc;
    globalThis.aktualizujSekcjeSlupa = aktualizujSekcjeSlupa;
    globalThis.ustawRodzajSlupa = ustawRodzajSlupa;
    globalThis.ustawPosadowienie = ustawPosadowienie;
    globalThis.synchronizujOcenePraduZLiczba = synchronizujOcenePraduZLiczba;
    globalThis.synchronizujOceneGazuZLiczba = synchronizujOceneGazuZLiczba;
    globalThis.przelaczZakladkeKalkulatora = przelaczZakladkeKalkulatora;
    globalThis.przelicz = przelicz;

    globalThis.wrzucAnalizeDoKalkulatora = function (tekstLubPayload) {
        const dane = wyciagnijDaneZEventu(tekstLubPayload);
        if (czySaDaneBota(dane)) zastosujDaneBota(dane);
    };
    globalThis.__kalkulatorLoaded = true;

    podlaczNasluchPostMessage();
    podlaczNasluchGotowosciBota();
    podlaczObserwatorTekstuBota();
    podlaczPrzyciskPelnegoEkranuMapy();
    if (!podlaczNasluchBota()) {
        const proba = setInterval(() => {
            if (podlaczNasluchBota()) clearInterval(proba);
        }, 300);
    }

    dodajInfrastrukture('E');

    if (KALKULATOR_NO_CODE) {
        document.body.classList.add('kalkulator-no-code');
    } else {
        odswiezTrybZapisuUI();
    }

    if (!KALKULATOR_NO_CODE) {
        document.getElementById('btn-generate-code').addEventListener('click', zapiszWynikPodKodem);
    }