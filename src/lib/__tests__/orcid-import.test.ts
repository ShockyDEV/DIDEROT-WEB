import { describe, expect, it } from "vitest";
import {
  buildCandidates,
  classifyCandidates,
  cleanText,
  fixMojibake,
  formatAuthorName,
  formatContributors,
  initialsOf,
  isValidOrcidId,
  mapOrcidType,
  normalizeTitle,
  orcidCheckDigit,
  ownerFromPersonalDetails,
  parseOrcidId,
  preferredSummary,
  selfDois,
  toPublicationData,
  type ExistingPublication,
  type OrcidBulkResponse,
  type OrcidCandidate,
  type OrcidWork,
  type OrcidWorksResponse,
} from "@/lib/orcid-import";
import worksFixture from "./fixtures/orcid-works.json";
import bulkFixture from "./fixtures/orcid-bulk.json";

/*
 * Fixtures escritos a mano con la forma REAL de la API pública de ORCID
 * v3.0 (GET /v3.0/{orcid}/works y /v3.0/{orcid}/works/{put-codes}),
 * tomada de la respuesta del perfil 0000-0003-1828-5182: grupos con varias
 * fuentes, DOI «self» y «part-of», fechas incompletas, contribuidores con
 * mojibake y en orden «Apellidos Nombre», un error en el bulk…
 */

const ORCID = "0000-0003-1828-5182";
const works = worksFixture as unknown as OrcidWorksResponse;
const bulk = bulkFixture as unknown as OrcidBulkResponse;

function detailsMap(): Map<number, OrcidWork> {
  const map = new Map<number, OrcidWork>();
  for (const item of bulk.bulk ?? []) {
    const pc = item.work?.["put-code"];
    if (item.work && typeof pc === "number") map.set(pc, item.work);
  }
  return map;
}

const owner = ownerFromPersonalDetails(
  ORCID,
  {
    name: {
      "given-names": { value: "Javier" },
      "family-name": { value: "Merchán-Sánchez-Jara" },
      "credit-name": null,
    },
  },
  "Javier Félix Merchán Sánchez-Jara",
);

function candidates(): OrcidCandidate[] {
  return buildCandidates(ORCID, works, detailsMap(), owner);
}

describe("ORCID iD", () => {
  it("calcula el dígito de control ISO 7064 11,2", () => {
    expect(orcidCheckDigit("000000021825009")).toBe("7");
    expect(orcidCheckDigit("000000031828518")).toBe("2");
    expect(orcidCheckDigit("000000021694233")).toBe("X");
  });

  it("valida formato y dígito de control", () => {
    expect(isValidOrcidId("0000-0002-1825-0097")).toBe(true);
    expect(isValidOrcidId("0000-0003-1828-5182")).toBe(true);
    expect(isValidOrcidId("0000-0002-1694-233X")).toBe(true);
    expect(isValidOrcidId("0000-0003-1828-5183")).toBe(false); // dígito erróneo
    expect(isValidOrcidId("0000-0003-1828-518")).toBe(false);
    expect(isValidOrcidId("0000000318285182")).toBe(false); // sin guiones no es la forma canónica
  });

  it("extrae el iD de lo que se pega en el panel", () => {
    expect(parseOrcidId("0000-0003-1828-5182")).toBe(ORCID);
    expect(parseOrcidId(" https://orcid.org/0000-0003-1828-5182/ ")).toBe(ORCID);
    expect(parseOrcidId("http://www.orcid.org/0000-0003-1828-5182")).toBe(ORCID);
    expect(parseOrcidId("orcid.org/0000-0003-1828-5182")).toBe(ORCID);
    expect(parseOrcidId("0000000318285182")).toBe(ORCID);
    expect(parseOrcidId("0000-0002-1694-233x")).toBe("0000-0002-1694-233X");
    expect(parseOrcidId("0000-0003-1828-5183")).toBeNull();
    expect(parseOrcidId("https://evil.example/0000-0003-1828-5182")).toBeNull();
    expect(parseOrcidId("")).toBeNull();
    expect(parseOrcidId(null)).toBeNull();
  });
});

describe("mapOrcidType", () => {
  it("traduce los tipos de ORCID a los del panel", () => {
    expect(mapOrcidType("journal-article")).toBe("ARTICLE");
    expect(mapOrcidType("book")).toBe("BOOK");
    expect(mapOrcidType("edited-book")).toBe("BOOK");
    expect(mapOrcidType("book-chapter")).toBe("CHAPTER");
    expect(mapOrcidType("conference-paper")).toBe("CONFERENCE");
    expect(mapOrcidType("conference-abstract")).toBe("CONFERENCE");
    expect(mapOrcidType("conference-poster")).toBe("CONFERENCE");
    expect(mapOrcidType("dissertation-thesis")).toBe("THESIS");
    expect(mapOrcidType("JOURNAL_ARTICLE")).toBe("ARTICLE"); // formato antiguo
  });

  it("el resto es OTHER", () => {
    expect(mapOrcidType("report")).toBe("OTHER");
    expect(mapOrcidType("data-set")).toBe("OTHER");
    expect(mapOrcidType(null)).toBe("OTHER");
  });
});

describe("limpieza de textos", () => {
  it("repara el mojibake UTF-8 leído como Latin-1", () => {
    expect(fixMojibake("Sara GonzÃ¡lez-GutiÃ©rrez")).toBe("Sara González-Gutiérrez");
    expect(fixMojibake("Merchán")).toBe("Merchán"); // texto correcto: intacto
    expect(fixMojibake("São Paulo")).toBe("São Paulo");
  });

  it("quita etiquetas, decodifica entidades y colapsa espacios", () => {
    expect(cleanText("<jats:p>Hola &amp; <i>adiós</i></jats:p>")).toBe("Hola & adiós");
    expect(cleanText("  a\n  b ")).toBe("a b");
    expect(cleanText(null)).toBe("");
  });

  it("normaliza títulos para comparar", () => {
    expect(normalizeTitle("Didáctica  DIGITAL: ¡el jazz!")).toBe("didactica digital el jazz");
  });
});

describe("autores «Apellidos, N.»", () => {
  it("iniciales de los nombres de pila", () => {
    expect(initialsOf("Javier Félix")).toBe("J. F.");
    expect(initialsOf("Jean-Pierre")).toBe("J.-P.");
    expect(initialsOf("María de los Ángeles")).toBe("M. Á.");
    expect(initialsOf("JF")).toBe("J. F.");
    expect(initialsOf("J.F.")).toBe("J. F.");
  });

  it("formatea los nombres tal como llegan de ORCID", () => {
    expect(formatAuthorName("Sara González-Gutiérrez")).toBe("González-Gutiérrez, S.");
    expect(formatAuthorName("Martín Lobato, Beatriz L.")).toBe("Martín Lobato, B. L.");
    expect(formatAuthorName("María de la Fuente")).toBe("de la Fuente, M.");
    expect(formatAuthorName("José Ortega y Gasset")).toBe("Ortega y Gasset, J.");
    expect(formatAuthorName("Merchan JF")).toBe("Merchan, J. F.");
    expect(formatAuthorName("Wei XU")).toBe("XU, W."); // «XU» no son iniciales
    expect(formatAuthorName("García-Iasci Patricia", "family-first")).toBe("García-Iasci, P.");
    expect(formatAuthorName("Platón")).toBe("Platón");
  });

  it("detecta al titular y el orden «Apellidos Nombre» de la editorial", () => {
    const text = formatContributors(
      [
        { "credit-name": { value: "García-Iasci Patricia" } },
        { "credit-name": { value: "Merchán Sánchez-Jara Javier" } },
      ],
      owner,
    );
    expect(text).toBe("García-Iasci, P.; Merchán-Sánchez-Jara, J.");
  });

  it("descarta editores si hay autores y quita repetidos", () => {
    const text = formatContributors(
      [
        { "credit-name": { value: "Sara González-Gutiérrez" } },
        {
          "credit-name": { value: "Ana Editora Prueba" },
          "contributor-attributes": { "contributor-role": "editor" },
        },
        { "credit-name": { value: "Sara González-Gutiérrez" } },
      ],
      owner,
    );
    expect(text).toBe("González-Gutiérrez, S.");
  });

  it("sin contribuidores usa al titular (datos de ORCID o nombre del miembro)", () => {
    expect(formatContributors([], owner)).toBe("Merchán-Sánchez-Jara, J.");
    expect(
      formatContributors(undefined, { orcid: ORCID, given: null, family: null, fallbackName: "Nombre Miembro" }),
    ).toBe("Nombre Miembro");
  });
});

describe("buildCandidates", () => {
  it("una candidata por obra (grupo), con datos del detalle", () => {
    const list = candidates();
    expect(list).toHaveLength(6);

    const article = list.find((c) => c.doi === "10.3390/aieduc2030022");
    expect(article).toMatchObject({
      key: `${ORCID}:219341159`,
      putCode: 219341159, // la versión preferida (mayor display-index)
      groupPutCodes: [219341159, 219737205],
      type: "ARTICLE",
      year: 2026,
      venue: "AI in Education",
      url: "https://doi.org/10.3390/aieduc2030022",
      authors: "González-Gutiérrez, S.; Merchán-Sánchez-Jara, J.",
      abstract: "Resumen de prueba con & entidades y marcado.",
    });
  });

  it("el DOI de un capítulo es el suyo, no el del libro (part-of)", () => {
    const chapter = candidates().find((c) => c.type === "CHAPTER");
    expect(chapter?.doi).toBe("10.1007/978-981-97-1814-6_135");
    expect(chapter?.venue).toBeNull();
    expect(chapter?.authors).toBe("García-Iasci, P.; Merchán-Sánchez-Jara, J.");
  });

  it("DOI normalizado, subtítulo, etiquetas fuera y titular como autor", () => {
    const list = candidates();
    expect(list.some((c) => c.doi === "10.7203/leeme.0.27178")).toBe(true);
    const paper = list.find((c) => c.type === "CONFERENCE");
    expect(paper?.title).toBe("Didáctica digital del jazz en secundaria: una propuesta de aula");
    expect(paper?.doi).toBeNull();
    expect(paper?.authors).toBe("Merchán-Sánchez-Jara, J.");
  });

  it("sin fecha → año null; URLs que no son http(s) se descartan", () => {
    const report = candidates().find((c) => c.orcidType === "report");
    expect(report?.year).toBeNull();
    expect(report?.type).toBe("OTHER");
    expect(report?.url).toBeNull();
  });

  it("ordena de la más reciente a la más antigua", () => {
    const years = candidates().map((c) => c.year ?? 0);
    expect([...years].sort((a, b) => b - a)).toEqual(years);
  });

  it("elige la versión preferida y solo DOIs «self»", () => {
    const group = works.group?.[0];
    expect(group && preferredSummary(group)?.["put-code"]).toBe(219341159);
    expect(
      selfDois({
        "external-id": [
          { "external-id-type": "doi", "external-id-value": "10.1000/BOOK", "external-id-relationship": "part-of" },
          { "external-id-type": "doi", "external-id-value": "https://doi.org/10.1000/Self" },
        ],
      }),
    ).toEqual(["10.1000/self"]);
  });
});

describe("classifyCandidates", () => {
  const YEAR = 2026;

  it("marca como nuevas las que no están y no importables las incompletas", () => {
    const result = classifyCandidates(candidates(), [], YEAR);
    const byStatus = (s: string) => result.filter((r) => r.status === s);
    expect(byStatus("new")).toHaveLength(4);
    // Mismo título y año con otro DOI (doble registro en Crossref).
    expect(byStatus("batch-duplicate")).toHaveLength(1);
    expect(byStatus("incomplete")).toHaveLength(1);
    for (const r of result) {
      expect(r.selected).toBe(r.status === "new");
      expect(r.importable).toBe(r.status === "new" || r.status === "possible-duplicate");
    }
  });

  it("detecta las que ya están en el panel (DOI, put-code o título + año)", () => {
    const existing: ExistingPublication[] = [
      // Manual con el DOI en otra forma
      { id: "a", title: "Otro título", year: 2026, doi: "https://doi.org/10.3390/AIEDUC2030022", orcidPutCode: null },
      // Importada antes desde OTRA versión (otra fuente) del mismo grupo… no aplica aquí;
      // importada del capítulo con su put-code
      { id: "b", title: "x", year: 2024, doi: null, orcidPutCode: `${ORCID}:166812634` },
      // Del Portal USAL, sin DOI: mismo título y año
      { id: "c", title: "Plataformas digitales de producción musical en el aula.", year: 2023, doi: null, orcidPutCode: null },
    ];
    const result = classifyCandidates(candidates(), existing, YEAR);
    const find = (pred: (c: OrcidCandidate) => boolean) => result.find(pred);

    expect(find((c) => c.putCode === 219341159)).toMatchObject({
      status: "exists",
      match: { id: "a" },
      importable: false,
    });
    expect(find((c) => c.putCode === 166812634)).toMatchObject({ status: "exists", match: { id: "b" } });
    const leeme = result.filter((c) => c.title.startsWith("Plataformas"));
    expect(leeme.map((c) => c.status)).toEqual(["exists", "exists"]);
  });

  it("reconoce el put-code de otra versión de la misma obra", () => {
    const existing: ExistingPublication[] = [
      { id: "m", title: "t", year: 2026, doi: null, orcidPutCode: `${ORCID}:219737205` },
    ];
    const article = classifyCandidates(candidates(), existing, YEAR).find(
      (c) => c.putCode === 219341159,
    );
    expect(article?.status).toBe("exists");
  });

  it("título casi igual con año ±1 → posible duplicado (importable, sin marcar)", () => {
    const existing: ExistingPublication[] = [
      { id: "p", title: "Didáctica digital del jazz en secundaria", year: 2021, doi: null, orcidPutCode: null },
    ];
    const paper = classifyCandidates(candidates(), existing, YEAR).find((c) => c.type === "CONFERENCE");
    expect(paper).toMatchObject({
      status: "possible-duplicate",
      importable: true,
      selected: false,
      match: { id: "p" },
    });
  });

  it("deduplica entre varios ORCID del mismo lote (coautores)", () => {
    const coauthor = "0000-0002-1825-0097";
    const own = candidates().filter((c) => c.doi === "10.3390/aieduc2030022");
    const theirs = own.map((c) => ({ ...c, orcid: coauthor, key: `${coauthor}:999`, putCode: 999, groupPutCodes: [999] }));
    const result = classifyCandidates([...own, ...theirs], [], YEAR);
    expect(result.map((r) => r.status)).toEqual(["new", "batch-duplicate"]);
    expect(result[1].importable).toBe(false);
  });

  it("año fuera de rango → incompleta", () => {
    const [c] = candidates();
    const result = classifyCandidates([{ ...c, year: YEAR + 5 }], [], YEAR);
    expect(result[0].status).toBe("incomplete");
  });
});

describe("toPublicationData", () => {
  it("se guarda como ORCID, visible y con el put-code con prefijo", () => {
    const [c] = candidates();
    expect(toPublicationData(c)).toMatchObject({
      source: "orcid",
      orcidPutCode: `${ORCID}:${c.putCode}`,
      published: true,
      featured: false,
      openAccess: false,
      title: c.title,
      year: c.year,
    });
  });
});
