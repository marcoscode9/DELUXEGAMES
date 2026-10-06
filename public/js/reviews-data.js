// Reseñas de clientes. Mientras la lista esté vacía, la sección "Reseñas" y sus links permanecen ocultos.
// Cada reseña: [juego, usuario, puntaje (1 a 5, admite .5), texto]. Cargá solo mensajes reales y textuales, sin editar.
// Ejemplo: ['fc27','@usuario',5,'Texto tal cual lo escribió el cliente.']
export const reviewGames={fc27:'EA FC 27',gta6:'GTA VI · Preventa',fc26:'FC 26',gow:'God of War Ragnarök',gta5:'GTA V',re4:'Resident Evil 4 Remake'};
export const reviews=[
  // EA FC 27 Standard Edition
  ['fc27','@pupi_zarate',5,'De diez la atención por wpp y el juego es tremendo vicio 🙌⚽'],
  ['fc27','@agus_suarez99',5,'Re buena onda los pibes de whatsapp, me pasaron los datos en 5 minutos y ya estaba jugando.'],
  ['fc27','@valentin_lp',4.5,'Tardaron un toque en responder el wpp porque estaban a full, pero me guiaron re bien para poner la cuenta primaria.'],
  ['fc27','@faku.bostero',5,'Todo flama por wpp, re rápido.'],
  ['fc27','@santi_ledesma',4,'El juego vuela. Demoraron como 15 minutos en contestarme el wpp pero la atención fue impecable.'],
  ['fc27','@rodri_cba01',5,'Les escribí por wpp con el comprobante y me mandaron todo al toque. El FC 27 está zarpado mal.'],
  ['fc27','@leito.gamer',3.5,'Esperé casi 40 min que me contesten el whatsapp un sábado a la tarde. El juego anda de diez igual.'],
  ['fc27','@mati_caseros',5,'Paso a paso clarísimo por wsp, cero drama.'],
  ['fc27','@tomi.alvarez7',4,'Me costó un toque activarlo pero el soporte de wpp me ayudó enseguida con buena onda.'],
  // GTA VI - Preventa
  ['gta6','@bauti_villalba',5,'Ya tengo la preventa confirmada por wpp, qué manija por dios 🌴🚗'],
  ['gta6','@lucas_viamonte',4.5,'Hice la reserva y por whatsapp me explicaron al detalle cómo va a ser la entrega el día del lanzamiento. Muy atentos.'],
  ['gta6','@enzo.mza',5,'Compré, mandé comprobante a wpp y me anotaron de una. Cero vueltas.'],
  ['gta6','@ale_quilmes98',4,'Tardaron media hora en confirmar el pago por whatsapp pero re bien la predisposición.'],
  ['gta6','@nachito_ramos',5,'La mejor opción para reservar el GTA 6. Todo confirmado por wsp en el acto.'],
  ['gta6','@joaco.martinez.ok',3.5,'El precio de la preventa es el mejor, aunque colgaron bastante en responderme el whatsapp para tomarme los datos.'],
  ['gta6','@franco_merlo',5,'Atención impecable en whatsapp, me sacaron todas las dudas de la cuenta primaria.'],
  ['gta6','@seba_urquiza',4.5,'Buena comunicación por wpp, me dieron tranquilidad con la reserva.'],
  ['gta6','@dani_baires',5,'Directo y seguro por wpp. Ahora a esperar que salga nomás.'],
  // FC 26 Standard Edition
  ['fc26','@gabi_lanus',5,'Les escribí a wpp y en 2 minutos ya tenía los datos. El precio un regalo.'],
  ['fc26','@mateo.silva23',4,'Demoró un toque la entrega por wsp pero la cuenta primaria anda sin dramas.'],
  ['fc26','@thiago_perez.ar',5,'Re cracks los del wpp, me pasaron un video tutorial cortito y lo configuré al toque 🙌'],
  ['fc26','@alan_belgrano',4.5,'Muy amables por whatsapp para ayudarme a instalarlo en la play 4 de mi hermano.'],
  ['fc26','@marquitos_cai',5,'Joya todo por wpp.'],
  ['fc26','@julian_sanmartin',3.5,'Tardaron como 45 minutos en contestar el wpp porque tenían cola de pedidos. Fuera de eso, el juego anda perfecto.'],
  ['fc26','@ramiro_tandil',5,'Impecable el soporte en whatsapp, rápida entrega y el FC 26 anda de diez.'],
  ['fc26','@nico_acosta.ok',4,'Buen precio. Por wsp me atendieron bien aunque tardaron unos 20 min en pasarme los datos.'],
  // God of War Ragnarök
  ['gow','@facu_kratos99',5,'Obra de arte de juego y por wpp me pasaron todo enseguida 🪓❄️'],
  ['gow','@luciano_moron',5,'Mandé comprobante al wsp y me atendieron al instante. Muy fácil de activar.'],
  ['gow','@diego_haedo',4.5,'Tardaron unos 10 minutitos en responder el whatsapp pero me explicaron todo impecable.'],
  ['gow','@santino_castelar',4,'El juego es cine puro. Se demoraron un poco en wpp pero la cuenta funciona 10 puntos en mi usuario.'],
  ['gow','@manu_olivos',5,'Atención de diez por wpp, re serios.'],
  ['gow','@bruno_sanisidro',4,'Me costó entender el paso a paso pero el chico de wsp me tuvo re buena paciencia.'],
  ['gow','@elias_zarate',5,'Todo perfecto por whatsapp. Descargando el Ragnarök sin ningún drama.'],
  ['gow','@tobi_tigre',4.5,'Gran precio y muy buena predisposición en el chat de wpp.'],
  // Grand Theft Auto V
  ['gta5','@felipe_devoto',5,'Clásico total. Por wpp me atendieron de una y ya estoy jugando el online 🚗💨'],
  ['gta5','@ivan_berazategui',4,'Tardaron un ratito en pasarme la cuenta por whatsapp pero la atención fue re educada.'],
  ['gta5','@benicio_lp',5,'Al toque por wpp, re piola.'],
  ['gta5','@gonzalo_quilmes',4.5,'Compré para PS5. Les hablé a wpp, me verificaron el pago rápido y me pasaron las instrucciones.'],
  ['gta5','@maxi_avellaneda',3.5,'Esperé como media hora en whatsapp para que me manden la cuenta. La atención después fue buena y el juego anda joya.'],
  ['gta5','@joel_lugano',5,'Re bien explicado todo por wsp, primera vez que compro cuenta primaria y cero lío.'],
  ['gta5','@pedro_mataderos',4,'Se demoró un toque el wsp pero el precio es insuperable y el juego anda joya 😎'],
  ['gta5','@simon_flores',5,'Excelente atención en whatsapp. Rápido y confiable.'],
  // Resident Evil 4 Remake
  ['re4','@gero_villacrespo',5,'Juegazo mal, en wpp me pasaron la cuenta al toque y el tutorial se entiende de una 🔥🧟'],
  ['re4','@valen_palermo',4.5,'Me respondieron en 10 minutos por whatsapp y me ayudaron a dejarla como principal. Muy conforme.'],
  ['re4','@dante_paternal',5,'Compré, escribí al wpp y me atendieron al toque. Todo flama.'],
  ['re4','@kevin_moreno',4,'Tardaron un poco en contestar el wsp por la hora pero me pasaron los datos bien claritos.'],
  ['re4','@camilo_ballester',5,'Impecable el soporte por wpp. El RE4 anda perfecto y sin cortes.'],
  ['re4','@nacho_sanjusto',4.5,'Muy buena onda los pibes de whatsapp, me tuvieron paciencia y quedó andando al toque.'],
  ['re4','@mateo_munro',4,'Esperé unos 20 min en wpp pero la cuenta primaria funciona de diez.'],
  ['re4','@lucho_caseros',3.5,'Tardaron bastante en atenderme por whatsapp porque tenían mucha demanda, pero cumplieron y el juego anda impecable.']
];
