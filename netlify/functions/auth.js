exports.handler = async (event, context) => {
  // Gestisci solo POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Gestisci preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    // Credenziali stored come variabili d'ambiente su Netlify
    const credentials = {
      // Admin users
      'FraVita': process.env.FRAVITA_PASSWORD,
      'savi': process.env.SAVI_PASSWORD,
      'NicolaL.1004': process.env.NICOLAL_PASSWORD,
      'DavideAnge': process.env.DAVIDEANGE_PASSWORD,
      'Lucaespo': process.env.LUCAESPO_PASSWORD,
      'meris': process.env.MERIS_PASSWORD,
      'corti_sugo': process.env.CORTISUGO_PASSWORD,
      'fedeg': process.env.FEDEG_PASSWORD,
      'FalcoCinese': process.env.FALCOCINESE_PASSWORD,
      'AleVitali': process.env.ALEVITALI_PASSWORD,
      'BreVismara': process.env.BREVISMARA_PASSWORD,
      'FraTerrone': process.env.FRATERRONE_PASSWORD,
      'DonGio': process.env.DONGIO_PASSWORD,
      // Regular users
      'Brignoli.2501': process.env.BRIGNOLI_PASSWORD,
      'Malerba.2502': process.env.MALERBA_PASSWORD,
      // ... aggiungi tutti gli altri utenti
    };

    const adminUsers = ['FraVita', 'savi', 'NicolaL.1004', 'FalcoCinese', 'AleVitali', 'BreVismara', 'FraTerrone', 'DonGio', 'fedeg', 'corti_sugo', 'meris', 'Lucaespo', 'DavideAnge'];

    // Verifica credenziali
    if (credentials[username] && credentials[username] === password) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            username,
            isAdmin: adminUsers.includes(username)
          }
        })
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        })
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Server error'
      })
    };
  }
};
