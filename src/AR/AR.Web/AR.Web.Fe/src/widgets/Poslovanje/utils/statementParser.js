export const parseStatementXml = (xmlString) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'text/xml')

    const error = doc.querySelector('parsererror')
    if (error) throw new Error('Invalid XML file')

    const zaglavlje = doc.querySelector('Zaglavlje')
    if (!zaglavlje) throw new Error('Missing Zaglavlje element')

    const attr = (el, name) => el.getAttribute(name) || ''
    const num = (el, name) => parseFloat(el.getAttribute(name)) || 0

    const sifraValuteMap = { '941': 'RSD', '840': 'USD', '978': 'EUR' }
    const resolveValuta = (el) => {
        const oznaka = attr(el, 'OznakaValute')
        if (oznaka) return oznaka
        const sifra = attr(el, 'SifraValute')
        if (sifra && sifraValuteMap[sifra]) return sifraValuteMap[sifra]
        if (sifra) return sifra
        return 'RSD'
    }

    const stavkeEls = doc.querySelectorAll('Stavke')
    const stavke = Array.from(stavkeEls).map((el) => ({
        nalogKorisnik: attr(el, 'NalogKorisnik'),
        mesto: attr(el, 'Mesto'),
        brojRacuna: attr(el, 'BrojRacunaPrimaocaPosiljaoca'),
        opis: attr(el, 'Opis'),
        sifraPlacanja: attr(el, 'SifraPlacanja'),
        sifraPlacanjaOpis: attr(el, 'SifraPlacanjaOpis'),
        duguje: num(el, 'Duguje'),
        potrazuje: num(el, 'Potrazuje'),
        modelZaduzenja: attr(el, 'ModelZaduzenjaOdobrenja'),
        pozivNaBrojZaduzenja: attr(el, 'PozivNaBrojZaduzenjaOdobrenja'),
        modelKorisnika: attr(el, 'ModelKorisnika'),
        pozivNaBrojKorisnika: attr(el, 'PozivNaBrojKorisnika'),
        brojZaReklamaciju: attr(el, 'BrojZaReklamaciju'),
        referenca: attr(el, 'Referenca'),
        datumValute: attr(el, 'DatumValute'),
    }))

    const header = {
        vrstaIzvoda: attr(zaglavlje, 'VrstaIzvoda'),
        izvodId: attr(zaglavlje, 'IzvodID'),
        brojIzvoda: attr(zaglavlje, 'BrojIzvoda'),
        datumIzvoda: attr(zaglavlje, 'DatumIzvoda'),
        maticniBroj: attr(zaglavlje, 'MaticniBroj'),
        komitentNaziv: attr(zaglavlje, 'KomitentNaziv'),
        komitentAdresa: attr(zaglavlje, 'KomitentAdresa'),
        komitentMesto: attr(zaglavlje, 'KomitentMesto'),
        partija: attr(zaglavlje, 'Partija'),
        valuta: resolveValuta(zaglavlje),
        tipRacuna: attr(zaglavlje, 'TipRacuna'),
        prethodnoStanje: num(zaglavlje, 'PrethodnoStanje'),
        dugovniPromet: num(zaglavlje, 'DugovniPromet'),
        potrazniPromet: num(zaglavlje, 'PotrazniPromet'),
        novoStanje: num(zaglavlje, 'NovoStanje'),
    }

    return { ...header, stavke }
}
