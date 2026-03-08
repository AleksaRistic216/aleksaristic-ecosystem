import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const fmtNum = (n) =>
    (n || 0).toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

const normalizeStavke = (stavke) => {
    if (!stavke) return []
    if (Array.isArray(stavke)) return stavke
    return Object.values(stavke)
}

export const statementToCsv = (s) => {
    const stavke = normalizeStavke(s.stavke)
    const lines = []
    lines.push(
        ['Statement #', s.brojIzvoda].join(','),
        ['Date', s.datumIzvoda].join(','),
        ['Company', `"${s.komitentNaziv}"`].join(','),
        ['Address', `"${s.komitentAdresa}, ${s.komitentMesto}"`].join(','),
        ['Account', s.partija].join(','),
        ['Currency', s.valuta || 'RSD'].join(','),
        ['Previous Balance', fmtNum(s.prethodnoStanje)].join(','),
        ['Debit', fmtNum(s.dugovniPromet)].join(','),
        ['Credit', fmtNum(s.potrazniPromet)].join(','),
        ['New Balance', fmtNum(s.novoStanje)].join(','),
        '',
        'Payer/Payee,Description,Payment Code,Debit,Credit,Value Date',
    )
    stavke.forEach((t) => {
        lines.push(
            [
                `"${t.nalogKorisnik || ''}"`,
                `"${t.opis || ''}"`,
                t.sifraPlacanja || '',
                t.duguje > 0 ? fmtNum(t.duguje) : '',
                t.potrazuje > 0 ? fmtNum(t.potrazuje) : '',
                t.datumValute || '',
            ].join(','),
        )
    })
    const csv = lines.join('\n')
    return 'data:text/csv;base64,' + btoa(unescape(encodeURIComponent(csv)))
}

export const statementToPdf = (s) => {
    const stavke = normalizeStavke(s.stavke)
    const doc = new jsPDF()
    const valuta = s.valuta || 'RSD'

    doc.setFontSize(14)
    doc.text(`Bank Statement #${s.brojIzvoda}`, 14, 18)

    doc.setFontSize(9)
    const info = [
        `Date: ${s.datumIzvoda}`,
        `Company: ${s.komitentNaziv}`,
        `Address: ${s.komitentAdresa}, ${s.komitentMesto}`,
        `Account: ${s.partija}`,
        `Currency: ${valuta}`,
        '',
        `Previous Balance: ${fmtNum(s.prethodnoStanje)} ${valuta}`,
        `Debit: ${fmtNum(s.dugovniPromet)} ${valuta}`,
        `Credit: ${fmtNum(s.potrazniPromet)} ${valuta}`,
        `New Balance: ${fmtNum(s.novoStanje)} ${valuta}`,
    ]
    info.forEach((line, i) => {
        doc.text(line, 14, 28 + i * 5)
    })

    const startY = 28 + info.length * 5 + 4

    autoTable(doc, {
        startY,
        head: [['Payer/Payee', 'Description', 'Code', 'Debit', 'Credit', 'Date']],
        body: stavke.map((t) => [
            t.nalogKorisnik || '',
            t.opis || '',
            t.sifraPlacanja || '',
            t.duguje > 0 ? `${fmtNum(t.duguje)} ${valuta}` : '',
            t.potrazuje > 0 ? `${fmtNum(t.potrazuje)} ${valuta}` : '',
            t.datumValute || '',
        ]),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [66, 66, 66] },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 50 },
            3: { halign: 'right' },
            4: { halign: 'right' },
        },
    })

    const base64 = doc.output('datauristring').replace(/^data:application\/pdf;filename=.*?;base64,/, '')
    return 'data:application/pdf;base64,' + base64
}
