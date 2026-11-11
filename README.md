# Funções de pertinência na lógica fuzzy

Demonstração acadêmica em Angular 21 e Angular Material 21, preparada para uma apresentação de 30 minutos. Usa o exemplo de altura da seção 14.7.3 de Russell e Norvig como ponto de partida.

## Rodar localmente

Com Node.js 22.12 ou mais recente da série 22 instalado, execute:

```sh
npm ci
npm start
```

Abra [a demonstração local](http://127.0.0.1:4200/). Para servir a versão compilada, rode `npm run build` e depois `node scripts/serve.mjs`. No Windows, `iniciar-demo.cmd` também inicia o servidor da versão compilada.

## Conteúdo

A altura de 1,78 m é conhecida. O grau de pertinência descreve quanto ela satisfaz uma descrição, conforme uma função definida.

Para "alta", a demonstração usa uma rampa: grau zero até 1,60 m, crescimento linear até 1,90 m e grau um daí em diante. O resultado em 1,78 m é 0,6. O livro fornece o exemplo conceitual, mas não define esses limites nem esse grau para essa pessoa.

Para comparar as formas triangular, trapezoidal e gaussiana, usa-se a descrição "estatura média" em um contexto didático. Curvas com pico são adequadas a uma região intermediária. Uma curva que diminui para alturas muito grandes não representa adequadamente um conceito crescente como "alta".

| Forma para estatura média | Parâmetros | Grau em 1,78 m |
| --- | --- | ---: |
| Triangular | a=1,55; b=1,75; c=1,95 m | 0,850 |
| Trapezoidal | a=1,55; b=1,65; c=1,85; d=1,95 m | 1,000 |
| Gaussiana | centro=1,75 m; sigma=0,10 m | 0,956 |

Um único slider varia a altura de 1,40 a 2,10 m em passos de 0,01 m. A mesma altura alimenta todas as funções. Os marcadores, graus e cálculos mudam juntos, enquanto os parâmetros permanecem fixos. O valor inicial é 1,78 m. Não há cadastro de pessoas.

Os botões Baixa, Média e Alta selecionam o conjunto avaliado nas três funções. Média mantém as curvas triangular, trapezoidal e gaussiana originais. Baixa e Alta usam versões com ombro, que mantêm grau 1 nas extremidades: as duas formas lineares viram rampas com limites distintos, e a gaussiana é uma adaptação por partes, com uma cauda conectada a um platô. Os títulos, parâmetros, fórmulas e explicações acompanham a seleção. A seção expansível interpreta a altura atual e explica por que as funções concordam ou atribuem graus diferentes.

"Média" é uma descrição linguística do exemplo, não uma média estatística estimada. Os parâmetros ilustram diferentes formatos e não estabelecem classificações universais de pessoas. Os graus não são probabilidades e não precisam somar um.

## Testes e compilação

```sh
npm test
npm run build
```

O [GitHub Actions](.github/workflows/ci.yml) instala as dependências com `npm ci`, executa os testes e compila o app a cada push e pull request.

`src/app/fuzzy-engine.ts` contém as fórmulas e os parâmetros das funções. O componente mostra esses cálculos com gráficos SVG. `scripts/engine.test.ts` verifica as fronteiras, o pico, o platô, a simetria e os resultados numéricos. `npm run experiment` exporta os resultados de referência.

## Referências

- RUSSELL, Stuart; NORVIG, Peter. Inteligência artificial. 3. ed. Rio de Janeiro: Elsevier, 2013. Seção 14.7.3. Localização no PDF fornecido: páginas 643-644.
- [Fórmula triangular](https://www.mathworks.com/help/fuzzy/trimf.html).
- [Fórmula trapezoidal](https://www.mathworks.com/help/fuzzy/trapmf.html).
- [Fórmula gaussiana](https://www.mathworks.com/help/fuzzy/gaussmf.html).

Russell e Norvig sustentam a explicação conceitual de pertinência. As três fórmulas específicas e a demonstração numérica constituem o recorte didático desenvolvido com referências técnicas complementares.
