    // lib/discoveryQueries.ts

    export type DiscoveryCardData = {
    id: string;
    emoji: string;
    title: string;
    subtitle: string;

    // kullanıcıya görünen başlık
    displayTitle: string;

    // API’ye gönderilen gerçek arama query’si
    searchQuery: string;
    };

    type QueryMap = Record<string, string[]>;

    /**
     * Tür bazlı kaliteli discovery query havuzu
     * Amaç:
     * - düz tür adına göre değil
     * - popüler / çok satan / ödüllü / bilinen kitaplara yakın sonuç üretmek
     */
    const GENRE_QUERY_MAP: QueryMap = {
    psikoloji: [
        "popüler psikoloji kitapları",
        "çok satan psikoloji kitapları",
        "insan davranışı psikoloji kitapları",
        "kişisel gelişim psikoloji kitapları",
        "bilinçaltı psikoloji kitapları",
        "duygusal zeka kitapları",
    ],

    "bilim kurgu": [
        "popüler bilim kurgu romanları",
        "çok satan bilim kurgu kitapları",
        "ödüllü bilim kurgu romanları",
        "distopya bilim kurgu romanları",
        "uzay temalı bilim kurgu kitapları",
        "yapay zeka bilim kurgu romanları",
    ],

    roman: [
        "çok satan romanlar",
        "popüler Türkçe romanlar",
        "ödüllü romanlar",
        "modern romanlar",
        "duygusal romanlar",
        "edebi romanlar",
    ],

    fantazi: [
        "popüler fantastik romanlar",
        "epik fantastik kitaplar",
        "çok satan fantastik seriler",
        "büyü temalı fantastik romanlar",
        "ödüllü fantastik kitaplar",
    ],

    polisiye: [
        "popüler polisiye romanlar",
        "çok satan polisiye kitapları",
        "gizem ve suç romanları",
        "dedektif romanları",
        "gerilim polisiye kitapları",
    ],

    tarih: [
        "popüler tarih kitapları",
        "çok satan tarih kitapları",
        "osmanlı tarihi kitapları",
        "dünya tarihi kitapları",
        "biyografi ve tarih kitapları",
    ],

    felsefe: [
        "popüler felsefe kitapları",
        "çok satan felsefe kitapları",
        "modern felsefe kitapları",
        "düşündüren felsefe kitapları",
        "başlangıç için felsefe kitapları",
    ],

    distopya: [
        "popüler distopya romanları",
        "çok satan distopya kitapları",
        "karanlık gelecek romanları",
        "politik distopya romanları",
    ],

    romantik: [
        "popüler romantik romanlar",
        "çok satan aşk romanları",
        "duygusal aşk kitapları",
        "modern romantik romanlar",
    ],

    klasik: [
        "dünya klasikleri",
        "mutlaka okunması gereken klasikler",
        "en iyi klasik romanlar",
        "ödüllü klasik eserler",
    ],

    korku: [
        "popüler korku romanları",
        "çok satan korku kitapları",
        "gerilim korku romanları",
        "psikolojik korku kitapları",
    ],

    macera: [
        "popüler macera romanları",
        "çok satan macera kitapları",
        "sürükleyici macera kitapları",
        "aksiyon macera romanları",
    ],

    biyografi: [
        "popüler biyografi kitapları",
        "ilham veren biyografiler",
        "ünlü insanların hayat hikayeleri",
        "çok satan biyografi kitapları",
    ],

    şiir: [
        "popüler şiir kitapları",
        "modern şiir kitapları",
        "Türk şiiri kitapları",
        "duygusal şiir kitapları",
    ],

    manga: [
        "popüler manga serileri",
        "çok satan manga kitapları",
        "anime uyarlaması mangalar",
        "aksiyon manga önerileri",
    ],

    çocuk: [
        "çocuk kitapları",
        "eğitici çocuk kitapları",
        "popüler çocuk hikayeleri",
        "çok satan çocuk kitapları",
    ],

    gençlik: [
        "genç yetişkin romanları",
        "popüler gençlik kitapları",
        "çok satan gençlik romanları",
        "sürükleyici gençlik kitapları",
    ],
    };

    const READER_TYPE_QUERY_MAP: QueryMap = {
    "deep reader": [
        "düşündüren romanlar",
        "felsefi romanlar",
        "derin karakterli kitaplar",
        "duygusal yoğunluğu yüksek romanlar",
    ],

    casual: [
        "akıcı ve sürükleyici kitaplar",
        "kolay okunan popüler romanlar",
        "çok satan hafif romanlar",
        "bağımlılık yapan kitaplar",
    ],

    akademik: [
        "akademik kitaplar",
        "entelektüel kitap önerileri",
        "bilimsel kitaplar",
        "araştırma odaklı kitaplar",
    ],

    romantik: [
        "duygusal aşk romanları",
        "romantik kitap önerileri",
        "çok satan aşk kitapları",
    ],

    keşifçi: [
        "farklı dünyalar anlatan romanlar",
        "yaratıcı hikaye kitapları",
        "keşif ve macera romanları",
    ],
    };

    function normalize(value: string) {
    return value.toLocaleLowerCase("tr").trim();
    }

    function pickRandom<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
    }

    /**
     * Tür bazlı discovery query üretir
     */
    export function getGenreDiscoveryQuery(genre: string) {
    const normalized = normalize(genre);

    const queries =
        GENRE_QUERY_MAP[normalized] ?? [
        `${genre} kitapları`,
        `popüler ${genre} kitapları`,
        `çok satan ${genre} kitapları`,
        `ödüllü ${genre} kitapları`,
        `${genre} romanları`,
        `en iyi ${genre} kitapları`,
        ];

    return pickRandom(queries);
    }

    /**
     * Okur tipi bazlı query üretir
     */
    export function getReaderTypeQuery(type: string) {
    const normalized = normalize(type);

    const queries =
        READER_TYPE_QUERY_MAP[normalized] ?? [
        `${type} kitapları`,
        `popüler ${type} kitapları`,
        `çok satan ${type} romanları`,
        ];

    return pickRandom(queries);
    }