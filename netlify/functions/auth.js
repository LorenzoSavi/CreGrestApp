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
      'NicolaL.1004': process.env.NICOLAL_1004_PASSWORD,
      'DavideAnge': process.env.DAVIDEANGE_PASSWORD,
      'Lucaespo': process.env.LUCAESPO_PASSWORD,
      'meris': process.env.MERIS_PASSWORD,
      'corti_sugo': process.env.CORTI_SUGO_PASSWORD,
      'fedeg': process.env.FEDEG_PASSWORD,
      'prova': process.env.PROVA_PASSWORD,
      'FalcoCinese': process.env.FALCOCINESE_PASSWORD,
      'AleVitali': process.env.ALEVITALI_PASSWORD,
      'BreVismara': process.env.BREVISMARA_PASSWORD,
      'FraTerrone': process.env.FRATERRONE_PASSWORD,
      'DonGio': process.env.DONGIO_PASSWORD,
      // Regular users
      'Brignoli.2501': process.env.BRIGNOLI_2501_PASSWORD,
      'Malerba.2502': process.env.MALERBA_2502_PASSWORD,
      'DelGobbo.2503': process.env.DELGOBBO_2503_PASSWORD,
      'Cantù.2504': process.env.CANTU_2504_PASSWORD,
      'Cereda.2505': process.env.CEREDA_2505_PASSWORD,
      'Cirillo.2506': process.env.CIRILLO_2506_PASSWORD,
      'Rinaldi.2507': process.env.RINALDI_2507_PASSWORD,
      'Zerbini.2508': process.env.ZERBINI_2508_PASSWORD,
      'Elanany.2509': process.env.ELANANY_2509_PASSWORD,
      'Patranoui.2510': process.env.PATRANOUI_2510_PASSWORD,
      'Rottoli.2511': process.env.ROTTOLI_2511_PASSWORD,
      'Piacentini.2512': process.env.PIACENTINI_2512_PASSWORD,
      'Sandrineli.2513': process.env.SANDRINELI_2513_PASSWORD,
      'Ganzerla.2514': process.env.GANZERLA_2514_PASSWORD,
      'Cereda.2515': process.env.CEREDA_2515_PASSWORD,
      'Malfitano.2516': process.env.MALFITANO_2516_PASSWORD,
      'Montenegro.2517': process.env.MONTENEGRO_2517_PASSWORD,
      'Chiari.2518': process.env.CHIARI_2518_PASSWORD,
      'Locatelli.2519': process.env.LOCATELLI_2519_PASSWORD,
      'Baronchelli.2520': process.env.BARONCHELLI_2520_PASSWORD,
      'Colombelli.2521': process.env.COLOMBELLI_2521_PASSWORD,
      'Cornolti.2522': process.env.CORNOLTI_2522_PASSWORD,
      'Singh.2523': process.env.SINGH_2523_PASSWORD,
      'Cimitan.2524': process.env.CIMITAN_2524_PASSWORD,
      'Benedetti.2525': process.env.BENEDETTI_2525_PASSWORD,
      'Serighelli.2526': process.env.SERIGHELLI_2526_PASSWORD,
      'Zehliaj.2527': process.env.ZEHLIAJ_2527_PASSWORD,
      'Zambelli.2528': process.env.ZAMBELLI_2528_PASSWORD,
      'Petrocelli.2529': process.env.PETROCELLI_2529_PASSWORD,
      'Scalera.2530': process.env.SCALERA_2530_PASSWORD
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
