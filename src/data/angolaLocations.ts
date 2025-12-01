export interface Municipality {
    id: string;
    name: string;
    provinceId: string;
}

export interface Province {
    id: string;
    name: string;
}

export const ANGOLA_PROVINCES: Province[] = [
    { id: 'bengo', name: 'Bengo' },
    { id: 'benguela', name: 'Benguela' },
    { id: 'bie', name: 'Bié' },
    { id: 'cabinda', name: 'Cabinda' },
    { id: 'cuando-cubango', name: 'Cuando Cubango' },
    { id: 'cuanza-norte', name: 'Cuanza Norte' },
    { id: 'cuanza-sul', name: 'Cuanza Sul' },
    { id: 'cunene', name: 'Cunene' },
    { id: 'huambo', name: 'Huambo' },
    { id: 'huila', name: 'Huíla' },
    { id: 'luanda', name: 'Luanda' },
    { id: 'lunda-norte', name: 'Lunda Norte' },
    { id: 'lunda-sul', name: 'Lunda Sul' },
    { id: 'malanje', name: 'Malanje' },
    { id: 'moxico', name: 'Moxico' },
    { id: 'namibe', name: 'Namibe' },
    { id: 'uige', name: 'Uíge' },
    { id: 'zaire', name: 'Zaire' },
];

export const ANGOLA_MUNICIPALITIES: Municipality[] = [
    // Luanda
    { id: 'luanda-belas', name: 'Belas', provinceId: 'luanda' },
    { id: 'luanda-cacuaco', name: 'Cacuaco', provinceId: 'luanda' },
    { id: 'luanda-cazenga', name: 'Cazenga', provinceId: 'luanda' },
    { id: 'luanda-icolo-bengo', name: 'Ícolo e Bengo', provinceId: 'luanda' },
    { id: 'luanda-luanda', name: 'Luanda', provinceId: 'luanda' },
    { id: 'luanda-quicama', name: 'Quiçama', provinceId: 'luanda' },
    { id: 'luanda-talatona', name: 'Talatona', provinceId: 'luanda' },
    { id: 'luanda-viana', name: 'Viana', provinceId: 'luanda' },
    { id: 'luanda-kilamba-kiaxi', name: 'Kilamba Kiaxi', provinceId: 'luanda' },

    // Bengo
    { id: 'bengo-ambriz', name: 'Ambriz', provinceId: 'bengo' },
    { id: 'bengo-bula-atumba', name: 'Bula Atumba', provinceId: 'bengo' },
    { id: 'bengo-dande', name: 'Dande', provinceId: 'bengo' },
    { id: 'bengo-dembos', name: 'Dembos', provinceId: 'bengo' },
    { id: 'bengo-nambuangongo', name: 'Nambuangongo', provinceId: 'bengo' },
    { id: 'bengo-pango-aluquem', name: 'Pango Aluquem', provinceId: 'bengo' },

    // Benguela
    { id: 'benguela-balombo', name: 'Balombo', provinceId: 'benguela' },
    { id: 'benguela-baia-farta', name: 'Baía Farta', provinceId: 'benguela' },
    { id: 'benguela-benguela', name: 'Benguela', provinceId: 'benguela' },
    { id: 'benguela-bocoio', name: 'Bocoio', provinceId: 'benguela' },
    { id: 'benguela-caimbambo', name: 'Caimbambo', provinceId: 'benguela' },
    { id: 'benguela-catumbela', name: 'Catumbela', provinceId: 'benguela' },
    { id: 'benguela-chongoroi', name: 'Chongorói', provinceId: 'benguela' },
    { id: 'benguela-cubal', name: 'Cubal', provinceId: 'benguela' },
    { id: 'benguela-ganda', name: 'Ganda', provinceId: 'benguela' },
    { id: 'benguela-lobito', name: 'Lobito', provinceId: 'benguela' },

    // Huambo
    { id: 'huambo-bailundo', name: 'Bailundo', provinceId: 'huambo' },
    { id: 'huambo-cachiungo', name: 'Cachiungo', provinceId: 'huambo' },
    { id: 'huambo-caala', name: 'Caála', provinceId: 'huambo' },
    { id: 'huambo-ecunha', name: 'Ekunha', provinceId: 'huambo' },
    { id: 'huambo-huambo', name: 'Huambo', provinceId: 'huambo' },
    { id: 'huambo-londuimbali', name: 'Londuimbali', provinceId: 'huambo' },
    { id: 'huambo-longonjo', name: 'Longonjo', provinceId: 'huambo' },
    { id: 'huambo-mungo', name: 'Mungo', provinceId: 'huambo' },
    { id: 'huambo-chicala-choloanga', name: 'Chicala-Choloanga', provinceId: 'huambo' },
    { id: 'huambo-chinjenje', name: 'Chinjenje', provinceId: 'huambo' },
    { id: 'huambo-ucuma', name: 'Ucuma', provinceId: 'huambo' },

    // Huíla
    { id: 'huila-caconda', name: 'Caconda', provinceId: 'huila' },
    { id: 'huila-cacula', name: 'Cacula', provinceId: 'huila' },
    { id: 'huila-caluquembe', name: 'Caluquembe', provinceId: 'huila' },
    { id: 'huila-chiange', name: 'Chiange', provinceId: 'huila' },
    { id: 'huila-chibia', name: 'Chibia', provinceId: 'huila' },
    { id: 'huila-chicomba', name: 'Chicomba', provinceId: 'huila' },
    { id: 'huila-chipindo', name: 'Chipindo', provinceId: 'huila' },
    { id: 'huila-cuvango', name: 'Cuvango', provinceId: 'huila' },
    { id: 'huila-humpata', name: 'Humpata', provinceId: 'huila' },
    { id: 'huila-jamba', name: 'Jamba', provinceId: 'huila' },
    { id: 'huila-lubango', name: 'Lubango', provinceId: 'huila' },
    { id: 'huila-matala', name: 'Matala', provinceId: 'huila' },
    { id: 'huila-quilengues', name: 'Quilengues', provinceId: 'huila' },
    { id: 'huila-quipungo', name: 'Quipungo', provinceId: 'huila' },

    // Bié
    { id: 'bie-andulo', name: 'Andulo', provinceId: 'bie' },
    { id: 'bie-camacupa', name: 'Camacupa', provinceId: 'bie' },
    { id: 'bie-catabola', name: 'Catabola', provinceId: 'bie' },
    { id: 'bie-chinguar', name: 'Chinguar', provinceId: 'bie' },
    { id: 'bie-chitembo', name: 'Chitembo', provinceId: 'bie' },
    { id: 'bie-cuemba', name: 'Cuemba', provinceId: 'bie' },
    { id: 'bie-cunhinga', name: 'Cunhinga', provinceId: 'bie' },
    { id: 'bie-cuito', name: 'Cuito', provinceId: 'bie' },
    { id: 'bie-nharea', name: 'Nharea', provinceId: 'bie' },

    // Cabinda
    { id: 'cabinda-belize', name: 'Belize', provinceId: 'cabinda' },
    { id: 'cabinda-buco-zau', name: 'Buco-Zau', provinceId: 'cabinda' },
    { id: 'cabinda-cabinda', name: 'Cabinda', provinceId: 'cabinda' },
    { id: 'cabinda-cacongo', name: 'Cacongo', provinceId: 'cabinda' },

    // Cuando Cubango
    { id: 'cuando-cubango-calai', name: 'Calai', provinceId: 'cuando-cubango' },
    { id: 'cuando-cubango-cuangar', name: 'Cuangar', provinceId: 'cuando-cubango' },
    { id: 'cuando-cubango-cuchi', name: 'Cuchi', provinceId: 'cuando-cubango' },
    { id: 'cuando-cubango-cuito-cuanavale', name: 'Cuito Cuanavale', provinceId: 'cuando-cubango' },
    { id: 'cuando-cubango-dirico', name: 'Dirico', provinceId: 'cuando-cubango' },
    { id: 'cuando-cubango-mavinga', name: 'Mavinga', provinceId: 'cuando-cubango' },
    { id: 'cuando-cubango-menongue', name: 'Menongue', provinceId: 'cuando-cubango' },
    { id: 'cuando-cubango-nankova', name: 'Nankova', provinceId: 'cuando-cubango' },
    { id: 'cuando-cubango-rivungo', name: 'Rivungo', provinceId: 'cuando-cubango' },

    // Cuanza Norte
    { id: 'cuanza-norte-ambaca', name: 'Ambaca', provinceId: 'cuanza-norte' },
    { id: 'cuanza-norte-banga', name: 'Banga', provinceId: 'cuanza-norte' },
    { id: 'cuanza-norte-bolongongo', name: 'Bolongongo', provinceId: 'cuanza-norte' },
    { id: 'cuanza-norte-cambambe', name: 'Cambambe', provinceId: 'cuanza-norte' },
    { id: 'cuanza-norte-cazengo', name: 'Cazengo', provinceId: 'cuanza-norte' },
    { id: 'cuanza-norte-golungo-alto', name: 'Golungo Alto', provinceId: 'cuanza-norte' },
    { id: 'cuanza-norte-gonguembo', name: 'Gonguembo', provinceId: 'cuanza-norte' },
    { id: 'cuanza-norte-lucala', name: 'Lucala', provinceId: 'cuanza-norte' },
    { id: 'cuanza-norte-quiculungo', name: 'Quiculungo', provinceId: 'cuanza-norte' },
    { id: 'cuanza-norte-samba-caju', name: 'Samba Caju', provinceId: 'cuanza-norte' },

    // Cuanza Sul
    { id: 'cuanza-sul-amboim', name: 'Amboim', provinceId: 'cuanza-sul' },
    { id: 'cuanza-sul-cassongue', name: 'Cassongue', provinceId: 'cuanza-sul' },
    { id: 'cuanza-sul-cela', name: 'Cela', provinceId: 'cuanza-sul' },
    { id: 'cuanza-sul-conda', name: 'Conda', provinceId: 'cuanza-sul' },
    { id: 'cuanza-sul-ebo', name: 'Ebo', provinceId: 'cuanza-sul' },
    { id: 'cuanza-sul-libolo', name: 'Libolo', provinceId: 'cuanza-sul' },
    { id: 'cuanza-sul-mussende', name: 'Mussende', provinceId: 'cuanza-sul' },
    { id: 'cuanza-sul-porto-amboim', name: 'Porto Amboim', provinceId: 'cuanza-sul' },
    { id: 'cuanza-sul-quibala', name: 'Quibala', provinceId: 'cuanza-sul' },
    { id: 'cuanza-sul-quilenda', name: 'Quilenda', provinceId: 'cuanza-sul' },
    { id: 'cuanza-sul-seles', name: 'Seles', provinceId: 'cuanza-sul' },
    { id: 'cuanza-sul-sumbe', name: 'Sumbe', provinceId: 'cuanza-sul' },

    // Cunene
    { id: 'cunene-cahama', name: 'Cahama', provinceId: 'cunene' },
    { id: 'cunene-cuanhama', name: 'Cuanhama', provinceId: 'cunene' },
    { id: 'cunene-curoca', name: 'Curoca', provinceId: 'cunene' },
    { id: 'cunene-cuvelai', name: 'Cuvelai', provinceId: 'cunene' },
    { id: 'cunene-namacunde', name: 'Namacunde', provinceId: 'cunene' },
    { id: 'cunene-ombadja', name: 'Ombadja', provinceId: 'cunene' },

    // Lunda Norte
    { id: 'lunda-norte-cambulo', name: 'Cambulo', provinceId: 'lunda-norte' },
    { id: 'lunda-norte-capenda-camulemba', name: 'Capenda-Camulemba', provinceId: 'lunda-norte' },
    { id: 'lunda-norte-caungula', name: 'Caungula', provinceId: 'lunda-norte' },
    { id: 'lunda-norte-chitato', name: 'Chitato', provinceId: 'lunda-norte' },
    { id: 'lunda-norte-cuango', name: 'Cuango', provinceId: 'lunda-norte' },
    { id: 'lunda-norte-cuilo', name: 'Cuílo', provinceId: 'lunda-norte' },
    { id: 'lunda-norte-lubalo', name: 'Lubalo', provinceId: 'lunda-norte' },
    { id: 'lunda-norte-lucapa', name: 'Lucapa', provinceId: 'lunda-norte' },
    { id: 'lunda-norte-xaxau', name: 'Xá-Muteba', provinceId: 'lunda-norte' },

    // Lunda Sul
    { id: 'lunda-sul-cacolo', name: 'Cacolo', provinceId: 'lunda-sul' },
    { id: 'lunda-sul-dala', name: 'Dala', provinceId: 'lunda-sul' },
    { id: 'lunda-sul-muconda', name: 'Muconda', provinceId: 'lunda-sul' },
    { id: 'lunda-sul-saurimo', name: 'Saurimo', provinceId: 'lunda-sul' },

    // Malanje
    { id: 'malanje-cacuso', name: 'Cacuso', provinceId: 'malanje' },
    { id: 'malanje-calandula', name: 'Calandula', provinceId: 'malanje' },
    { id: 'malanje-cambundi-catembo', name: 'Cambundi-Catembo', provinceId: 'malanje' },
    { id: 'malanje-cangandala', name: 'Cangandala', provinceId: 'malanje' },
    { id: 'malanje-caombo', name: 'Caombo', provinceId: 'malanje' },
    { id: 'malanje-cuaba-nzogo', name: 'Cuaba Nzogo', provinceId: 'malanje' },
    { id: 'malanje-cunda-dia-baze', name: 'Cunda-Dia-Baze', provinceId: 'malanje' },
    { id: 'malanje-luquembo', name: 'Luquembo', provinceId: 'malanje' },
    { id: 'malanje-malanje', name: 'Malanje', provinceId: 'malanje' },
    { id: 'malanje-massango', name: 'Massango', provinceId: 'malanje' },
    { id: 'malanje-mucari', name: 'Mucari', provinceId: 'malanje' },
    { id: 'malanje-quela', name: 'Quela', provinceId: 'malanje' },
    { id: 'malanje-quirima', name: 'Quirima', provinceId: 'malanje' },

    // Moxico
    { id: 'moxico-alto-zambeze', name: 'Alto Zambeze', provinceId: 'moxico' },
    { id: 'moxico-bundas', name: 'Bundas', provinceId: 'moxico' },
    { id: 'moxico-camanongue', name: 'Camanongue', provinceId: 'moxico' },
    { id: 'moxico-cameia', name: 'Cameia', provinceId: 'moxico' },
    { id: 'moxico-luau', name: 'Luau', provinceId: 'moxico' },
    { id: 'moxico-luacano', name: 'Luacano', provinceId: 'moxico' },
    { id: 'moxico-luchazes', name: 'Luchazes', provinceId: 'moxico' },
    { id: 'moxico-luena', name: 'Luena', provinceId: 'moxico' },
    { id: 'moxico-moxico', name: 'Moxico', provinceId: 'moxico' },

    // Namibe
    { id: 'namibe-bibala', name: 'Bibala', provinceId: 'namibe' },
    { id: 'namibe-camucuio', name: 'Camucuio', provinceId: 'namibe' },
    { id: 'namibe-mocamedes', name: 'Moçâmedes', provinceId: 'namibe' },
    { id: 'namibe-tompua', name: 'Tômbua', provinceId: 'namibe' },
    { id: 'namibe-virei', name: 'Virei', provinceId: 'namibe' },

    // Uíge
    { id: 'uige-alto-cauale', name: 'Alto Cauale', provinceId: 'uige' },
    { id: 'uige-ambuila', name: 'Ambuíla', provinceId: 'uige' },
    { id: 'uige-bembe', name: 'Bembe', provinceId: 'uige' },
    { id: 'uige-buengas', name: 'Buengas', provinceId: 'uige' },
    { id: 'uige-bungo', name: 'Bungo', provinceId: 'uige' },
    { id: 'uige-damba', name: 'Damba', provinceId: 'uige' },
    { id: 'uige-maquela-zombo', name: 'Maquela do Zombo', provinceId: 'uige' },
    { id: 'uige-milunga', name: 'Milunga', provinceId: 'uige' },
    { id: 'uige-mucaba', name: 'Mucaba', provinceId: 'uige' },
    { id: 'uige-negage', name: 'Negage', provinceId: 'uige' },
    { id: 'uige-puri', name: 'Puri', provinceId: 'uige' },
    { id: 'uige-quimbele', name: 'Quimbele', provinceId: 'uige' },
    { id: 'uige-quitexe', name: 'Quitexe', provinceId: 'uige' },
    { id: 'uige-sanza-pombo', name: 'Sanza Pombo', provinceId: 'uige' },
    { id: 'uige-songo', name: 'Songo', provinceId: 'uige' },
    { id: 'uige-uige', name: 'Uíge', provinceId: 'uige' },

    // Zaire
    { id: 'zaire-cuimba', name: 'Cuimba', provinceId: 'zaire' },
    { id: 'zaire-mbanza-congo', name: 'Mbanza Congo', provinceId: 'zaire' },
    { id: 'zaire-noqui', name: 'Nóqui', provinceId: 'zaire' },
    { id: 'zaire-nzeto', name: 'Nzeto', provinceId: 'zaire' },
    { id: 'zaire-soio', name: 'Soio', provinceId: 'zaire' },
    { id: 'zaire-tomboco', name: 'Tomboco', provinceId: 'zaire' },
];
