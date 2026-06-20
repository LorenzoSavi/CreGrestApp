exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

  const headers = {
     'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    // Admin users (accesso a TotalPoint)
    const adminUsers = ['Savi', 'Leidi', 'Brambo', 'DonGio', 'Francesco'];
    // Proiezione classifica
    const classificaUsers = ['Classifica'];

    // All credentials from Netlify env vars
    const credentials = {
      // Admin
      'Savi': process.env.SAVI_PASSWORD,
      'Leidi': process.env.LEIDI_PASSWORD,
      'Brambo': process.env.BRAMBO_PASSWORD,
      'DonGio': process.env.DONGIO_PASSWORD,
      'Francesco': process.env.FRANCESCO_PASSWORD,
      // Proiezione classifica
      'Classifica': process.env.CLASSIFICA_PASSWORD,
      // Regular users
      'Locatelli': process.env.LOCATELLI_PASSWORD,
      'Cornolti': process.env.CORNOLTI_PASSWORD,
      'LouiDiop': process.env.LOUIDIOP_PASSWORD,
      'Meris': process.env.MERIS_PASSWORD,
      'Belotti': process.env.BELOTTI_PASSWORD,
      'Serighelli': process.env.SERIGHELLI_PASSWORD,
      'Conti': process.env.CONTI_PASSWORD,
      'Cereda': process.env.CEREDA_PASSWORD,
      'Folzi': process.env.FOLZI_PASSWORD,
      'Gallucci': process.env.GALLUCCI_PASSWORD,
      'Lazzari': process.env.LAZZARI_PASSWORD,
      'Khadraoui': process.env.KHADRAOUI_PASSWORD,
      'Gotti': process.env.GOTTI_PASSWORD,
      'Pinsino': process.env.PINSINO_PASSWORD,
      'Zanchi': process.env.ZANCHI_PASSWORD,
      'Veliaj': process.env.VELIAJ_PASSWORD,
      'Bonzi': process.env.BONZI_PASSWORD,
      'Marzanni': process.env.MARZANNI_PASSWORD,
      'Renzetti': process.env.RENZETTI_PASSWORD,
      'Nava': process.env.NAVA_PASSWORD,
      'Valota': process.env.VALOTA_PASSWORD,
      'Castelli': process.env.CASTELLI_PASSWORD,
      'Cisse': process.env.CISSE_PASSWORD,
      'Cantu': process.env.CANTU_PASSWORD,
      'Cisse.D': process.env.CISSE_D_PASSWORD,
      'Singh': process.env.SINGH_PASSWORD,
      'Petrocelli': process.env.PETROCELLI_PASSWORD,
      'Ganzerla': process.env.GANZERLA_PASSWORD,
      'Zeliaj': process.env.ZELIAJ_PASSWORD,
      'Cirillo': process.env.CIRILLO_PASSWORD,
      'Impeduglia': process.env.IMPEDUGLIA_PASSWORD,
      'Khadraoui.A': process.env.KHADRAOUI_A_PASSWORD,
      'Otman': process.env.OTMAN_PASSWORD,
      'ElMazouria': process.env.ELMAZOURIA_PASSWORD,
      'Mushon': process.env.MUSHON_PASSWORD,
      'Benedetti': process.env.BENEDETTI_PASSWORD,
      'Cereda.F': process.env.CEREDA_F_PASSWORD,
      'Colombelli': process.env.COLOMBELLI_PASSWORD,
      'Previtali': process.env.PREVITALI_PASSWORD,
      // Nuovi utenti
      'Baronchelli.G': process.env.BARONCHELLI_G_PASSWORD,
      'Baronchelli.M': process.env.BARONCHELLI_M_PASSWORD,
      'Nasufi': process.env.NASUFI_PASSWORD,
      'Rottoli': process.env.ROTTOLI_PASSWORD,
      'Piacentini': process.env.PIACENTINI_PASSWORD,
      'Allevi': process.env.ALLEVI_PASSWORD,
      'Malfitano': process.env.MALFITANO_PASSWORD,
      // Marco Liani
      'LianiM': process.env.LIANIM_PASSWORD,
      // Omar Pina
      'Pina': process.env.PINA_PASSWORD,
    };

    const expectedPassword = credentials[username];

    if (!expectedPassword || password !== expectedPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Credenziali non valide' })
      };
    }

    const isAdmin = adminUsers.includes(username);
    const isClassifica = classificaUsers.includes(username);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        user: {
          username,
          isAdmin,
          isClassifica
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Errore interno del server' })
    };
  }
};
