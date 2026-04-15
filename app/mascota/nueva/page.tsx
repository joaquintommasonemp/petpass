"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const RAZAS: Record<string, string[]> = {
  Perro: [
    "Mestizo",
    // Pequeños
    "Caniche/Poodle", "Chihuahua", "Dachshund/Teckel", "Yorkshire Terrier", "Maltés",
    "Pomerania", "Bichón Frisé", "Shih Tzu", "Schnauzer Miniatura", "Pug / Carlino",
    "Pinscher Miniatura", "Cavalier King Charles", "Lhasa Apso", "Pequinés",
    "Papillon", "Spitz Alemán", "West Highland Terrier", "Cairn Terrier",
    "Fox Terrier", "Jack Russell Terrier", "Parson Russell Terrier", "Silky Terrier",
    "Brussels Griffon / Grifón", "Bolognese", "Coton de Tuléar", "Löwchen",
    "Schipperke", "Toy Fox Terrier", "Russian Toy", "Affenpinscher",
    // Medianos
    "Beagle", "Cocker Spaniel Inglés", "Cocker Spaniel Americano", "Bulldog Francés",
    "Bulldog Inglés", "Border Collie", "Labradoodle", "Goldendoodle", "Cockapoo",
    "Maltipoo", "Schnauzer Mediano", "Shar Pei", "Shiba Inu", "Basenji",
    "Basset Hound", "Whippet", "Galgo Español", "Galgo Inglés / Greyhound",
    "Corgi Galés Pembroke", "Corgi Galés Cardigan", "Shetland Sheepdog / Sheltie",
    "Australian Shepherd / Pastor Australiano", "Collie / Lassie", "American Cocker",
    "Springer Spaniel Inglés", "Braco Alemán", "Braco Italiano", "Pointer",
    "Setter Inglés", "Setter Irlandés", "Setter Gordon", "Vizsla / Braco Húngaro",
    "Weimaraner", "Perro de Agua Español", "Perro de Agua Portugués",
    "Catahoula", "Australian Cattle Dog / Blue Heeler", "Brittany",
    "Lagotto Romagnolo", "Keeshond", "Spitz Mediano",
    // Grandes
    "Labrador", "Golden Retriever", "Pastor Alemán", "Husky Siberiano",
    "Alaskan Malamute", "Akita Inu", "Akita Americano", "Rottweiler",
    "Doberman", "Boxer", "Dálmata", "Gran Danés", "San Bernardo",
    "Terranova / Newfoundland", "Boyero de Berna / Bernés de la Montaña",
    "Boyero de Flandes", "Dogo Argentino", "Dogo de Burdeos",
    "Cane Corso", "Bull Mastiff", "Mastín Napolitano", "Mastín Inglés",
    "Mastín Español", "Mastín Tibetano", "Fila Brasileño",
    "Malinois / Pastor Belga", "Groenendael", "Tervuren",
    "Chow Chow", "Samoyedo", "Bull Terrier", "Staffordshire Bull Terrier",
    "American Staffordshire / Pitbull", "Rhodesian Ridgeback", "Weimaraner",
    "Schnauzer Gigante", "Leonberger", "Boerboel", "Kangal",
    "Hovawart", "Eurasier", "Kuvasz", "Komondor", "Puli",
    "Irish Wolfhound / Lobero Irlandés", "Scottish Deerhound",
    "Flat-Coated Retriever", "Curly-Coated Retriever", "Nova Scotia Duck Tolling",
    "Xoloitzcuintle", "Otro",
  ],
  Gato: [
    "Mestizo / Común",
    "Europeo Común", "Criollo Argentino",
    // Razas populares
    "Persa", "Angora", "Siamés", "Maine Coon", "Ragdoll",
    "British Shorthair", "Scottish Fold", "Bengalí", "Sphynx / Esfinge",
    "Abisinio", "Burmés", "Russian Azul", "Himalayo",
    // Otras razas reconocidas
    "Balinés", "Birmano / Sagrado de Birmania", "Bombay", "Burmilla",
    "Chartreux", "Cornish Rex", "Devon Rex", "Egyptian Mau",
    "Exotic Shorthair", "Havana Brown", "Japanese Bobtail", "Khao Manee",
    "Korat", "La Perm", "Lykoi", "Maine Coon", "Manx", "Munchkin",
    "Neva Masquerade", "Noruego de los Bosques", "Ocicat", "Oriental",
    "Peterbald", "Ragamuffin", "Savannah", "Selkirk Rex",
    "Serengeti", "Siberiano", "Singapura", "Snowshoe",
    "Somali", "Tonquinés", "Toyger", "Turkish Van",
    "Turkish Angora", "York Chocolate",
    "Otro",
  ],
  Otro: [
    // Pequeños mamíferos
    "Conejo", "Cobayo / Guinea pig", "Chinchilla", "Hurón", "Hámster",
    "Jerbo", "Rata", "Ratón", "Erizo", "Degu", "Ardilla",
    // Aves
    "Loro / Cotorra", "Canario", "Cacatúa", "Agapornis / Inseparable",
    "Periquito", "Ninfas / Cockatiel", "Guacamayo / Ara",
    "Eclectus", "Amazona", "Pájaro del sol / Parrot",
    // Reptiles y anfibios
    "Tortuga de tierra", "Tortuga acuática", "Iguana Verde",
    "Dragón Barbudo", "Gecko Leopardo", "Gecko Diurno",
    "Camaleón", "Serpiente Boa", "Serpiente Corn Snake",
    "Serpiente Ball Python", "Lagarto Monitor", "Skink",
    "Rana / Sapo", "Axolotl",
    // Peces y acuáticos
    "Pez Betta", "Pez Dorado / Goldfish", "Pez Tropical",
    "Pez Koi", "Tortuga acuática",
    // Arácnidos e invertebrados
    "Tarántula", "Escorpión", "Cangrejo ermitaño",
    // Otros
    "Otro exótico",
  ],
};

const MUNICIPIOS_POR_PROVINCIA: Record<string, string[]> = {
  "CABA": [
    "Agronomía","Almagro","Balvanera","Barracas","Belgrano","Boedo","Caballito",
    "Chacarita","Coghlan","Colegiales","Constitución","Flores","Floresta","La Boca",
    "La Paternal","Liniers","Mataderos","Monte Castro","Montserrat","Nueva Pompeya",
    "Núñez","Palermo","Parque Avellaneda","Parque Chacabuco","Parque Chas",
    "Parque Patricios","Puerto Madero","Recoleta","Retiro","Saavedra","San Cristóbal",
    "San Nicolás","San Telmo","Versalles","Villa Crespo","Villa del Parque",
    "Villa Devoto","Villa General Mitre","Villa Lugano","Villa Luro","Villa Ortúzar",
    "Villa Pueyrredón","Villa Real","Villa Riachuelo","Villa Santa Rita","Villa Soldati",
    "Villa Urquiza","Villa Vélez Sarsfield",
  ],
  "Buenos Aires": [
    // GBA Norte
    "Tigre","San Isidro","San Fernando","Vicente López","San Martín","Tres de Febrero",
    "Pilar","Escobar","Malvinas Argentinas","José C. Paz","San Miguel","Hurlingham",
    "Ituzaingó","Moreno","General Rodríguez","Marcos Paz","Luján","Mercedes",
    // GBA Oeste
    "La Matanza","Merlo","Morón","Cañuelas",
    // GBA Sur
    "Avellaneda","Lanús","Lomas de Zamora","Quilmes","Berazategui","Florencio Varela",
    "Almirante Brown","Esteban Echeverría","Ezeiza","Presidente Perón","San Vicente",
    "Berisso","Ensenada","Brandsen",
    // Ciudades del interior
    "La Plata","Mar del Plata","Bahía Blanca","Tandil","Olavarría","Junín",
    "Pergamino","San Nicolás de los Arroyos","Zárate","Campana","San Pedro","Ramallo",
    "Necochea","Tres Arroyos","Coronel Suárez","Benito Juárez","Bolívar","Saladillo",
    "Chivilcoy","Bragado","9 de Julio","Lincoln","Pehuajó","Trenque Lauquen",
    "Rivadavia","General Villegas","Salto","Rojas","San Antonio de Areco",
    "Chascomús","Dolores","Maipú","Ayacucho","Rauch","General Lavalle",
    "Azul","Las Flores","General Alvear","Roque Pérez","Lobos","Monte",
    "Lobería","Balcarce","Mar Chiquita","General Pueyrredón","Miramar",
    "Necochea","Coronel Dorrego","Puan","Coronel Rosales","Monte Hermoso",
    "Villa Gesell","Pinamar","Mar de Ajó","Santa Teresita","San Clemente del Tuyú",
    "Partido de la Costa","General Madariaga","Tordillo","Castelli",
    "General Guido","Pila","Lezama","Magdalena","Punta Indio",
    "Alberti","Bragado","Carlos Casares","Carlos Tejedor","Daireaux",
    "General Arenales","General Paz","General Pinto","General Viamonte",
    "Hipólito Yrigoyen","Leandro N. Alem","Navarro","Nueve de Julio",
    "Pellegrini","Suipacha","Tapalqué","Trenque Lauquen",
  ],
  "Catamarca": [
    "San Fernando del Valle de Catamarca","Andalgalá","Tinogasta","Santa María",
    "Belén","Fiambalá","Recreo","Chumbicha","Huillapima","Pomán",
    "Antofagasta de la Sierra","Aconquija","Capayán","El Alto","Icaño",
    "Londres","Mutquín","Paclín","Poman","Santa Cruz","Valle Viejo",
  ],
  "Chaco": [
    "Resistencia","Barranqueras","Fontana","Villa Ángela","Presidencia Roque Sáenz Peña",
    "Charata","General San Martín","Quitilipi","Las Breñas","Juan José Castelli",
    "Tres Isletas","Corzuela","Machagai","Avia Terai","Pampa del Indio","El Sauzalito",
    "Presidencia de la Plaza","Colonias Unidas","Hermoso Campo","La Clotilde",
    "Makallé","Napenay","Santa Sylvina","Taco Pozo","Villa Berthet",
  ],
  "Chubut": [
    "Rawson","Comodoro Rivadavia","Esquel","Trelew","Puerto Madryn","Rada Tilly",
    "Sarmiento","Río Mayo","Lago Puelo","El Bolsón","Gaiman","Dolavon","28 de Julio",
    "Alto Río Senguer","Camarones","Cholila","Corcovado","Gobernador Costa",
    "Gualjaina","José de San Martín","Lago Blanco","Las Plumas","Los Altares",
    "Paso de Indios","Puerto Pirámides","Río Pico","Tecka",
  ],
  "Córdoba": [
    "Córdoba capital","Villa María","San Francisco","Río Cuarto","Río Tercero","Alta Gracia",
    "Villa Carlos Paz","La Falda","Cosquín","Bell Ville","Marcos Juárez","Jesús María",
    "Unquillo","Mendiolaza","Malagueño","Pilar","Oncativo","General Cabrera",
    "Laboulaye","Leones","Oliva","La Carlota","General Deheza","Villa Allende",
    "Saldán","Dean Funes","Cruz del Eje","Mina Clavero","Villa General Belgrano",
    "Santa Rosa de Calamuchita","Embalse","Villa Cura Brochero","Huerta Grande",
    "Arroyito","Berrotarán","Bialet Massé","Capilla del Monte","Carlos Paz",
    "Chazón","Cintra","Corral de Bustos","Despeñaderos","El Arañado",
    "Freyre","General Roca","La Granja","La Para","La Playosa","Las Varillas",
    "Luque","Morteros","Monte Buey","Noetinger","Obispo Trejo","Porteña",
    "Rioseco","Sacanta","San Francisco","San Marcos Sierras","Serrano",
    "Toledo","Tancacha","Villa del Rosario","Villa Dolores","Villa Giardino",
    "Villa Huidobro","Villa Nueva","Villa de María","Wenceslao Escalante",
  ],
  "Corrientes": [
    "Corrientes capital","Goya","Curuzú Cuatiá","Mercedes","Paso de los Libres",
    "Santo Tomé","Bella Vista","Esquina","Monte Caseros","Ituzaingó","San Luis del Palmar",
    "Mburucuyá","Saladas","General Alvear","Sauce","Yapeyú","Chavarría",
    "Concepción","Felipe Yofré","Garabi","Gobernador Virasoro","Itatí",
    "La Cruz","Loreto","Perugorría","Ramada Pasaje","San Cosme","San Miguel",
    "San Roque","Santa Lucía","Tapebicuá",
  ],
  "Entre Ríos": [
    "Paraná","Concordia","Gualeguaychú","Concepción del Uruguay","Villaguay","La Paz",
    "Colón","Federación","Victoria","Chajarí","San José","Basavilbaso",
    "Crespo","Diamante","Federal","Nogoyá","Rosario del Tala","Gualeguay",
    "Bovril","Caseros","Ceibas","Cerrito","Colón","Don Cristóbal","El Solar",
    "General Campos","General Galarza","General Ramírez","Hernandarias",
    "La Criolla","Lucas González","Maciá","María Grande","Urdinarrain",
    "Viale","Villa del Rosario","Villa Elisa","Villa Paranacito","Villaguay",
  ],
  "Formosa": [
    "Formosa capital","Clorinda","Pirané","El Colorado","Las Lomitas","Ibarreta",
    "Ingeniero Juárez","Gran Guardia","Laguna Blanca","Comandante Fontana",
    "Buena Vista","El Espinillo","General Lucio Victorio Mansilla","Herradura",
    "Laguna Naick Neck","Misión Tacaaglé","Palo Santo","Pozo del Mortero",
    "Riacho He Hé","San Martín 2","Siete Palmas","Subteniente Perín",
  ],
  "Jujuy": [
    "San Salvador de Jujuy","San Pedro de Jujuy","Palpalá","Libertador General San Martín",
    "Humahuaca","Tilcara","Purmamarca","La Quiaca","Abra Pampa","Perico",
    "Monterrico","El Carmen","Fraile Pintado","Yala","Caimancito","Calilegua",
    "Casabindo","Cochinoca","El Aguilar","Hipólito Yrigoyen","Huacalera",
    "La Esperanza","Ledesma","Maimará","Rinconada","Santa Catalina","Santa Clara",
    "Susques","Tres Cruces","Valle Grande","Volcán",
  ],
  "La Pampa": [
    "Santa Rosa","General Pico","Toay","Macachín","Eduardo Castex","Realicó",
    "General Acha","Victorica","Jacinto Aráuz","Guatraché","Doblas","Rancul","Trenel",
    "Alpachiri","Alta Italia","Anguil","Bernardo Larroude","Bernasconi","Catriló",
    "Colonia Barón","Colonia Santa Teresa","Embajador Martini","General Manuel Campos",
    "Intendente Alvear","La Adela","Lonquimay","Luan Toro","Metileo","Miguel Riglos",
    "Naicó","Parera","Quehué","Quetrequén","Rolón","Rucanelo","Sarah","Telén",
    "Unanué","Uriburu","Villa Mirasol","Winifreda",
  ],
  "La Rioja": [
    "La Rioja capital","Chilecito","Aimogasta","Chamical","Chepes","Villa Unión",
    "Vinchina","Nonogasta","Villa Sanagasta","Patquía","Famatina",
    "Ángulos","Castro Barros","Coronel Felipe Varela","General Ángel Vicente Peñaloza",
    "General Belgrano","General Juan Facundo Quiroga","General Lamadrid",
    "General San Martín","Independencia","Rosario Vera Peñaloza","San Blas de los Sauces",
    "Sanagasta","Arauco","Machigasta","Malanzan","Olpas","Tama",
  ],
  "Mendoza": [
    "Mendoza capital","San Rafael","Godoy Cruz","Guaymallén","Las Heras","Luján de Cuyo",
    "Maipú","Rivadavia","Junín","General Alvear","Malargüe","San Martín",
    "Tupungato","Tunuyán","San Carlos","Lavalle","Palmira","Bowen","Potrerillos",
    "Ciudad de Mendoza","Agrelo","Cacheuta","Chilecito","Chacras de Coria",
    "Colonia Las Rosas","El Algarrobal","El Bermejo","El Vergel","Eugenio Bustos",
    "Fray Luis Beltrán","Glorieta","Ingeniero Giagnoni","La Central","La Consulta",
    "Las Catitas","Los Árboles","Malarargüe","Medrano","Montecaseros",
    "Néctar","Pareditas","Perdriel","Punta de Vacas","Real del Padre",
    "Rodeo del Medio","Rodeo de la Cruz","Russell","San Roque","Santa Rosa",
    "Villa Atuel","Vista Flores",
  ],
  "Misiones": [
    "Posadas","Oberá","Eldorado","Apóstoles","Jardín América","Leandro N. Alem",
    "Puerto Iguazú","Aristóbulo del Valle","Montecarlo","Campo Grande","Capioví",
    "San Pedro","Bernardo de Irigoyen","Wanda","Puerto Rico",
    "Alba Posse","Almafuerte","Azara","Campo Viera","Candelaria","Caraguatay",
    "Cerro Corá","Colonia Aurora","Colonia Polana","Comandante Andresito",
    "Corpus","Dos de Mayo","El Alcázar","El Soberbio","Fachinal","Florentino Ameghino",
    "Garuhapé","Garupá","General Alvear","Hipólito Yrigoyen","Irigoyen",
    "Itacaruaré","Loreto","Los Helechos","Mártires","Mojón Grande","Oberá",
    "Oro Verde","Panambí","Picada Libertad","Piñalito Norte","Puerto Esperanza",
    "Puerto Leoni","Puerto Piray","Puerto Rico","Ruiz de Montoya","San Ignacio",
    "San Javier","San José","San Vicente","Santo Pipo","Tres Capones",
  ],
  "Neuquén": [
    "Neuquén capital","Zapala","San Martín de los Andes","Cutral Có","Plaza Huincul",
    "Junín de los Andes","Centenario","Plottier","Rincón de los Sauces",
    "Chos Malal","Piedra del Águila","Aluminé","Loncopué","Villa La Angostura",
    "Añelo","Bajada del Agrio","Barrancas","Buta Ranquil","Caviahue-Copahue",
    "Chorriaca","El Cholar","El Huecú","Huinganco","Las Lajas","Las Ovejas",
    "Los Catutos","Los Miches","Mariano Moreno","Minas","Picún Leufú",
    "Primeros Pinos","San Patricio del Chañar","Senillosa","Taquimilán",
    "Tricao Malal","Villa El Chocón","Villa Pehuenia","Vaca Muerta (zona)",
  ],
  "Río Negro": [
    "Viedma","San Carlos de Bariloche","General Roca","Cipolletti","Allen","El Bolsón",
    "Cinco Saltos","Catriel","San Antonio Oeste","Sierra Grande",
    "Jacobacci","Maquinchao","Los Menucos","Ingeniero Jacobacci",
    "Cervantes","Chichinales","Chimpay","Choele Choel","Clemente Onelli",
    "Comallo","Conesa","Coronel Belisle","Darwin","Dina Huapi",
    "El Cuy","Fray Luis Beltrán","General Enrique Godoy","General Fernández Oro",
    "Guardia Mitre","Ing. Huergo","Interior de Río Negro","Lamarque","Las Grutas",
    "Mencué","Ministro Ramos Mexía","Nahuel Niyeu","Ñorquinco","Paso Flores",
    "Pilcaniyeu","Pomona","San Antonio de Palmas","San Javier","Valcheta",
    "Valle Azul","Villa Llanquín","Villa Manzano","Villa Regina",
  ],
  "Salta": [
    "Salta capital","San Ramón de la Nueva Orán","Tartagal","Rosario de la Frontera",
    "General Güemes","Embarcación","Metán","Cafayate","Cachi","La Quiaca",
    "San Antonio de los Cobres","Rosario de Lerma","La Caldera","Cerrillos","El Bordo",
    "Aguaray","Animaná","Campo Quijano","Chicoana","Coronel Moldes",
    "El Carril","El Galpón","El Jardín","El Quebrachal","El Tala","Gachipampa",
    "Hipólito Yrigoyen","Iruya","Isla de Cañas","Joaquín V. González","Las Lajitas",
    "Los Toldos","Nazareno","Payogasta","Pichanal","Pocitos","Rivadavia Banda Norte",
    "Rivadavia Banda Sur","Rumihuasi","Salvador Mazza","San Carlos","San José de Metán",
    "Santa Victoria Este","Santa Victoria Oeste","Seclantas","Tolombón",
    "Urundel","Villa San Lorenzo","Vaqueros","Yaví",
  ],
  "San Juan": [
    "San Juan capital","Rawson","Rivadavia","Caucete","Santa Lucía","Pocito",
    "Chimbas","9 de Julio","Albardón","Angaco","Calingasta","Jáchal","Iglesia","Ullum",
    "25 de Mayo","Barreal","Cañada Honda","Cochagual","Colonia Fiscal",
    "Médano de Oro","Mogna","Niquivil","Pismanta","Rodeo","San Agustín del Valle Fértil",
    "San José de Jáchal","Sarmiento","Tamberías","Villa Independencia","Villa Naciente",
  ],
  "San Luis": [
    "San Luis capital","Villa Mercedes","Merlo","Justo Daract","La Toma","Quines",
    "Tilisarao","Santa Rosa del Conlara","Carpintería","Naschel","Luján","Concarán",
    "Alto Pelado","Alto Pencoso","Anchorena","Arizona","Batavia","Buena Esperanza",
    "Candelaria","Carolina","Cortaderas","El Trapiche","Fortuna","Juan Martín de Pueyrredón",
    "La Florida","La Punilla","Las Aguadas","Las Chacras","Las Lagunas","Lafinur",
    "Leandro N. Alem","Los Molles","Luyaba","Navia","Papagayos","Paso Grande",
    "Piedra Blanca","Renca","Saladillo","San Francisco del Monte de Oro",
    "San Martín","San Pablo","Santa Isabel","Talita","Varela","Villa de la Quebrada",
    "Villa del Carmen","Villa Larca","Villa General Roca",
  ],
  "Santa Cruz": [
    "Río Gallegos","Caleta Olivia","Pico Truncado","Las Heras","Perito Moreno",
    "El Calafate","El Chaltén","Puerto San Julián","Gobernador Gregores","Puerto Deseado",
    "28 de Noviembre","Comandante Luis Piedrabuena","Fitz Roy","Hipólito Yrigoyen",
    "Koluel Kaike","Las Heras","Los Antiguos","Mano Negra","Puerto Santa Cruz",
    "Río Turbio","Rospentek","San Julián","Tres Lagos","Yacimientos Río Turbio",
  ],
  "Santa Fe": [
    "Santa Fe capital","Rosario","Rafaela","Reconquista","Venado Tuerto","Villa Constitución",
    "San Lorenzo","Casilda","Esperanza","Las Rosas","Firmat","Cañada de Gómez",
    "Villa Gobernador Gálvez","Pérez","Gálvez","Sunchales","Santo Tomé",
    "Rufino","San Jorge","Tostado","Vera","Avellaneda","Calchaquí","San Cristóbal",
    "Álvarez","Amstrong","Arroyo Seco","Barrancas","Bigand","Bombal","Cañada Rosquín",
    "Capitán Bermúdez","Carcarañá","Carlos Pellegrini","Chañar Ladeado","Chovet",
    "Correa","El Trébol","Elortondo","Empalme Villa Constitución","Funes",
    "Fuentes","General Lagos","Granadero Baigorria","Ibarlucea","Jacinto L. Aráuz",
    "Laguna Paiva","Llambi Campbell","López","Los Molinos","Maciel","Máximo Paz",
    "Melincué","Montes de Oca","Nelson","Oliveros","Peyrano","Piamonte",
    "Puerto General San Martín","Ramona","Roldán","Rosario de la Frontera","San Agustín",
    "San Cristóbal","San Fabián","San Genaro","San Guillermo","San Javier",
    "San Justo","San Lorenzo","San Martín de las Escobas","Sancti Spíritu",
    "Santa Isabel","Sastre","Serodino","Soldini","Tostado","Totoras",
    "Villa Ana","Villa Cañas","Villa Minetti","Villa Mugueta","Villa Trinidad",
    "Wheelwright","Zavalla",
  ],
  "Santiago del Estero": [
    "Santiago del Estero capital","La Banda","Frías","Loreto","Añatuya","Quimilí",
    "Monte Quemado","Fernández","Termas de Río Hondo","Villa Río Hondo",
    "Clodomira","Beltrán","Los Telares","Amamá","Averías","Campo Gallo",
    "Colonia El Simbolar","Colonia Dora","Coronel Manuel Leoncio Rico",
    "El Hoyo","El Zanjón","Girar","Gramilla","Guardia Escolta","Herrera",
    "Huyamampa","Icaño","Isca Yacu","La Cañada","La Dársena","Las Tinajas",
    "Laprida","Lugones","Malbrán","Miraflores","Nueva Esperanza","Palo Negro",
    "Pampa de los Guanacos","Pozo Hondo","Real Sayana","Sachayoj","Selva",
    "Sol de Julio","Sumamao","Suncho Corral","Tintina","Villa Atamisqui","Villa General Mitre",
    "Villa Salavina","Villa Unión","Vilmer",
  ],
  "Tierra del Fuego": [
    "Ushuaia","Río Grande","Tolhuin","Puerto Almanza","Lago Escondido",
  ],
  "Tucumán": [
    "San Miguel de Tucumán","Yerba Buena","Banda del Río Salí","Alderetes",
    "Concepción","Monteros","Aguilares","Famailla","Bella Vista","Lules",
    "Simoca","Tafí Viejo","Las Talitas","El Manantial","Juan Bautista Alberdi",
    "Tafí del Valle","Amaicha del Valle","Acheral","Burruyacu","Capitán Cáceres",
    "Chicligasta","Ciudacita","Colalao del Valle","Colombres","Delfín Gallo",
    "El Bracho","El Cadillal","El Cercado","El Chañar","El Mollar","El Naranjo",
    "El Naranjito","El Puestito","Famaillá","Garmendia","Graneros",
    "Ingenio La Esperanza","La Cocha","La Cruz","La Ramada","León Rouges",
    "Los Nogales","Los Ralos","Los Sarmientos","Monteagudo","Quilmes (Tucumán)",
    "Raco","Río Chico","San Andrés","San Pablo","Santa Lucía","Santa Rosa de Leales",
    "Sgto. Moya","Soldado Maldonado","Tapia","Trancas","Villa Chiligasta",
    "Villa de Leales","Vipos",
  ],
};

const PROVINCIAS_LIST = Object.keys(MUNICIPIOS_POR_PROVINCIA);

export default function NuevaMascota() {
  const OBRAS_SOCIALES = [
    // Planes de salud especializados en mascotas
    "OSPAN", "Vetify", "Iké Mascotas", "Companion", "HolaVet",
    "Puppis One", "Total Pet", "PetPlus", "Medipet", "AVSIM", "Sosmask",
    "Mascota y Salud",
    // Seguros de aseguradoras y bancos
    "MAPFRE Mascotas", "BBVA Seguros Mascotas", "Banco Macro Mascotas",
    "Banco Hipotecario Mascotas", "Naranja X Mascotas", "Sancor Seguros",
    "Otra",
  ];

  const [form, setForm] = useState({
    name: "", type: "", breed: "", birth_month: "", birth_year: "",
    weight: "", sex: "Macho", color: "", chip: "",
    zona_tipo: "", zona_valor: "", cp: "", castrado: "",
    tiene_os: "", obra_social: "", os_plan: "", os_numero: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [solicitandoPremium, setSolicitandoPremium] = useState(false);
  const [premiumSolicitado, setPremiumSolicitado] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkLimit() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from("profiles").select("is_premium, is_admin").eq("id", user.id).single(),
        supabase.from("mascotas").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("active", true),
      ]);
      if (!profile) {
        await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });
      }
      const isPremium = profile?.is_premium === true || profile?.is_admin === true;
      if (!isPremium && (count || 0) >= 1) setLimitReached(true);
      setCheckingLimit(false);
    }
    checkLimit();
  }, []);

  function update(k: string, v: string) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "type") { next.breed = ""; next.zona_tipo = ""; next.zona_valor = ""; }
      if (k === "zona_tipo") { next.zona_valor = ""; }
      return next;
    });
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function calcAge() {
    if (!form.birth_month || !form.birth_year) return "";
    const month = parseInt(form.birth_month);
    const year = parseInt(form.birth_year);
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < 2000 || year > new Date().getFullYear()) return "";
    const now = new Date();
    const birth = new Date(year, month - 1);
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 0) return "";
    if (months < 12) return `${months} mes${months !== 1 ? "es" : ""}`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years} año${years !== 1 ? "s" : ""} y ${rem} mes${rem !== 1 ? "es" : ""}` : `${years} año${years !== 1 ? "s" : ""}`;
  }

  function buildLocation() {
    if (!form.zona_tipo) return "";
    if (form.zona_tipo === "CABA") return form.zona_valor ? form.zona_valor + ", CABA" : "CABA";
    return form.zona_valor ? form.zona_valor + ", " + form.zona_tipo : form.zona_tipo;
  }

  async function handleSave() {
    if (!form.name || !form.type || !form.breed) { setError("Nombre, tipo y raza son obligatorios"); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }

    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from("profiles").select("is_premium, is_admin").eq("id", user.id).single(),
      supabase.from("mascotas").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("active", true),
    ]);

    // Garantiza que el profile existe (puede faltar si el usuario confirmó email sin completar el flujo)
    if (!profile) {
      await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });
    }

    const isPremium = profile?.is_premium === true || profile?.is_admin === true;
    if (!isPremium && (count || 0) >= 1) { setLimitReached(true); setLoading(false); return; }

    const age = calcAge();
    const location = buildLocation();
    const { data: mascotaData, error: err } = await supabase.from("mascotas").insert({
      name: form.name, breed: form.breed, age, weight: form.weight ? `${form.weight} kg` : "",
      sex: form.sex, color: form.color, chip: form.chip, location,
      castrado: form.castrado || null,
      obra_social: form.tiene_os === "Sí" ? (form.obra_social || null) : null,
      os_plan: form.tiene_os === "Sí" ? (form.os_plan || null) : null,
      os_numero: form.tiene_os === "Sí" ? (form.os_numero || null) : null,
      photo_url: "", user_id: user.id,
    }).select();

    if (err) { setError(err.message); setLoading(false); return; }

    const mascota = mascotaData?.[0];

    // Subir foto si se seleccionó
    if (photoFile && mascota) {
      const ext = photoFile.name.split(".").pop();
      const path = `${mascota.id}/perfil.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("mascotas").upload(path, photoFile, { upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("mascotas").getPublicUrl(path);
        const url = urlData.publicUrl + "?t=" + Date.now();
        await supabase.from("mascotas").update({ photo_url: url }).eq("id", mascota.id);
      }
    }

    // Guardar peso inicial
    if (form.weight && mascota) {
      await supabase.from("historial").insert({
        mascota_id: mascota.id,
        title: "Peso inicial",
        summary: `${form.weight} kg`,
        date: new Date().toLocaleDateString("es-AR"),
        vet: "Registro inicial",
      });
    }

    window.location.href = "/dashboard";
    setLoading(false);
  }

  const sel = (label: string, key: string, opts: string[]) => (
    <div>
      <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>{label}</label>
      <select value={(form as any)[key]} onChange={e => update(key, e.target.value)}
        style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: (form as any)[key] ? "#1C3557" : "#64748B", width: "100%" }}>
        <option value="">Seleccioná...</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 25 }, (_, i) => String(currentYear - i));
  const age = calcAge();

  if (checkingLimit) return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "30px 20px 80px" }}>
      <div className="skeleton" style={{ height: 48, borderRadius: 12, marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 80, borderRadius: 14, marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 56, borderRadius: 14, marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 56, borderRadius: 14, marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 56, borderRadius: 14 }} />
    </div>
  );

  if (limitReached) {
    return (
      <main style={{ maxWidth: 440, margin: "0 auto", padding: "40px 20px 80px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🐾</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1C3557", marginBottom: 8 }}>
          Límite del plan gratuito
        </h2>
        <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          El plan gratuito incluye <strong style={{ color: "#1C3557" }}>1 mascota</strong>.<br />
          Activá Premium para agregar mascotas ilimitadas y acceder a todas las funciones.
        </p>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, padding: "20px 24px", marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontWeight: 800, color: "#EC4899", marginBottom: 12, textAlign: "center", fontSize: 15 }}>✨ Premium · $3.000/mes</div>
          {[
            "Mascotas ilimitadas",
            "Consultas Vet IA ilimitadas",
            "Análisis de estudios con IA",
            "Historial clínico completo",
            "Soporte prioritario",
          ].map(f => (
            <div key={f} style={{ fontSize: 13, color: "#1C3557", padding: "5px 0", display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ color: "#2CB8AD", fontWeight: 800 }}>✓</span> {f}
            </div>
          ))}
        </div>

        {premiumSolicitado ? (
          <div style={{ background: "#E5F7F6", border: "1px solid #B2E8E5", borderRadius: 14, padding: "14px 20px", marginBottom: 16 }}>
            <div style={{ fontWeight: 800, color: "#2CB8AD", marginBottom: 4 }}>✅ ¡Solicitud enviada!</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>El equipo de PetPass te contactará pronto.</div>
          </div>
        ) : (
          <button
            onClick={async () => {
              setSolicitandoPremium(true);
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                const res = await fetch("/api/suscripcion/crear", {
                  method: "POST",
                  headers: { "Authorization": `Bearer ${session.access_token}` },
                });
                const data = await res.json();
                if (data.url) { window.location.href = data.url; return; }
              }
              setSolicitandoPremium(false);
              setPremiumSolicitado(true);
            }}
            disabled={solicitandoPremium}
            style={{
              display: "block", width: "100%",
              background: "linear-gradient(135deg, #EC4899, #DB2777)",
              color: "#fff", border: "none", borderRadius: 14, padding: "14px 20px",
              fontWeight: 900, fontSize: 15, cursor: "pointer", marginBottom: 12,
              opacity: solicitandoPremium ? 0.6 : 1,
              boxShadow: "0 4px 20px rgba(236,72,153,0.3)",
            }}
          >{solicitandoPremium ? "Enviando..." : "Solicitar Premium →"}</button>
        )}

        <Link href="/dashboard" style={{
          display: "block", color: "#94A3B8", fontSize: 13, textDecoration: "none",
          padding: "10px 0",
        }}>← Volver al dashboard</Link>
      </main>
    );
  }

  return (
    <main className="pet-create-page" style={{ maxWidth: 440, margin: "0 auto", padding: "30px 20px 80px" }}>
      <div className="pet-create-hero" style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 48 }}>🐾</div>
        <h1 style={{ fontFamily: "Georgia, serif", color: "#2CB8AD", fontSize: 24, marginTop: 8 }}>Registrá tu mascota</h1>
      </div>

      <div className="pet-create-form" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Foto */}
        <div className="pet-create-photo">
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 8 }}>Foto de perfil</label>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div onClick={() => fileRef.current?.click()} style={{
              width: 80, height: 80, borderRadius: "50%", cursor: "pointer",
              background: "#FFFFFF", border: "2px dashed #E2E8F0",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0,
            }}>
              {photoPreview
                ? <img src={photoPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 32 }}>📷</span>
              }
            </div>
            <div>
              <button onClick={() => fileRef.current?.click()} style={{
                background: "#2CB8AD22", color: "#2CB8AD", border: "1px solid #2CB8AD44",
                borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700,
              }}>
                {photoPreview ? "Cambiar foto" : "Agregar foto"}
              </button>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>JPG o PNG · Opcional</div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </div>

        {/* Tipo */}
        <div className="pet-create-type">
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 8 }}>Tipo de mascota *</label>
          <div className="pet-create-choice-row" style={{ display: "flex", gap: 8 }}>
            {["Perro", "Gato", "Otro"].map(t => (
              <button key={t} onClick={() => update("type", t)} style={{
                flex: 1, padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 20,
                border: "1px solid", cursor: "pointer",
                background: form.type === t ? "#2CB8AD22" : "#FFFFFF",
                borderColor: form.type === t ? "#2CB8AD" : "#E2E8F0",
                color: form.type === t ? "#2CB8AD" : "#64748B",
              }}>
                {t === "Perro" ? "🐕" : t === "Gato" ? "🐱" : "🐾"}
                <div style={{ fontSize: 11, marginTop: 2 }}>{t}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Nombre *</label>
          <input value={form.name} placeholder="Ej: Tango" onChange={e => update("name", e.target.value)} />
        </div>

        {/* Raza */}
        {form.type && sel("Raza *", "breed", RAZAS[form.type] || [])}

        {/* Fecha nacimiento */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Fecha de nacimiento</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <select value={form.birth_month} onChange={e => update("birth_month", e.target.value)}
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: form.birth_month ? "#1C3557" : "#64748B", width: "100%" }}>
              <option value="">Mes</option>
              {months.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
            </select>
            <select value={form.birth_year} onChange={e => update("birth_year", e.target.value)}
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: form.birth_year ? "#1C3557" : "#64748B", width: "100%" }}>
              <option value="">Año</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {age && <div style={{ marginTop: 6, color: "#2CB8AD", fontSize: 12, fontWeight: 600 }}>Edad actual: {age}</div>}
        </div>

        {/* Sexo */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Sexo</label>
          <div className="pet-create-choice-row" style={{ display: "flex", gap: 8 }}>
            {["Macho", "Hembra"].map(s => (
              <button key={s} onClick={() => update("sex", s)} style={{
                flex: 1, padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 14,
                border: "1px solid", cursor: "pointer",
                background: form.sex === s ? "#2CB8AD22" : "#FFFFFF",
                borderColor: form.sex === s ? "#2CB8AD" : "#E2E8F0",
                color: form.sex === s ? "#2CB8AD" : "#64748B",
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Castrado */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 8 }}>¿Está castrad{form.sex === "Hembra" ? "a" : "o"}?</label>
          <div className="pet-create-choice-row" style={{ display: "flex", gap: 8 }}>
            {["Sí", "No", "No sé"].map(op => (
              <button key={op} onClick={() => update("castrado", op)} style={{
                flex: 1, padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 13,
                border: "1px solid", cursor: "pointer",
                background: form.castrado === op ? "#2CB8AD22" : "#FFFFFF",
                borderColor: form.castrado === op ? "#2CB8AD" : "#E2E8F0",
                color: form.castrado === op ? "#2CB8AD" : "#64748B",
              }}>{op}</button>
            ))}
          </div>
        </div>

        {/* Peso */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Peso (kg)</label>
          <input type="number" value={form.weight} placeholder="Ej: 28" onChange={e => update("weight", e.target.value)} />
        </div>

        {/* Color */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Color / pelaje</label>
          <input value={form.color} placeholder="Ej: Dorado" onChange={e => update("color", e.target.value)} />
        </div>

        {/* Chip */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Número de chip (opcional)</label>
          <input value={form.chip} placeholder="Ej: 985112345678901" onChange={e => update("chip", e.target.value)} />
        </div>

        {/* Obra social / seguro */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 8 }}>¿Tiene obra social o seguro veterinario?</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["Sí", "No"].map(op => (
              <button key={op} onClick={() => update("tiene_os", op)} style={{
                flex: 1, padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 13,
                border: "1px solid", cursor: "pointer",
                background: form.tiene_os === op ? "#2CB8AD22" : "#FFFFFF",
                borderColor: form.tiene_os === op ? "#2CB8AD" : "#E2E8F0",
                color: form.tiene_os === op ? "#2CB8AD" : "#64748B",
              }}>{op}</button>
            ))}
          </div>
          {form.tiene_os === "Sí" && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10, background: "#F4F6FB", borderRadius: 12, padding: 14, border: "1px solid #E2E8F0" }}>
              <div>
                <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Obra social / aseguradora</label>
                <select
                  value={form.obra_social}
                  onChange={e => update("obra_social", e.target.value)}
                  style={{ width: "100%", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: form.obra_social ? "#1C3557" : "#94A3B8", fontSize: 13 }}
                >
                  <option value="">Seleccioná una opción</option>
                  {OBRAS_SOCIALES.map(os => <option key={os} value={os}>{os}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Plan</label>
                <input
                  value={form.os_plan}
                  placeholder="Ej: Plan Básico, Plan Completo..."
                  onChange={e => update("os_plan", e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Número de socio / póliza</label>
                <input
                  value={form.os_numero}
                  placeholder="Ej: 123456789"
                  onChange={e => update("os_numero", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Zona */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 8 }}>Zona donde vive</label>
          {sel("Provincia / Ciudad", "zona_tipo", PROVINCIAS_LIST)}
          {form.zona_tipo && (
            <div style={{ marginTop: 10 }}>
              {sel(form.zona_tipo === "CABA" ? "Barrio" : "Municipio / Localidad", "zona_valor", MUNICIPIOS_POR_PROVINCIA[form.zona_tipo] || [])}
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: "#f8717115", border: "1px solid #f8717133", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>
            {error}
          </div>
        )}

        <button onClick={handleSave} disabled={loading} style={{
          background: "linear-gradient(135deg, #2CB8AD, #229E94)",
          color: "#fff", border: "none", borderRadius: 12,
          padding: 14, fontWeight: 800, fontSize: 15, marginTop: 8,
          opacity: loading ? 0.6 : 1, boxShadow: "0 4px 20px #2CB8AD30",
        }}>{loading ? "Guardando..." : "Crear perfil 🐾"}</button>
      </div>
    </main>
  );
}
