# Camada · Calculadora de impressão 3D

Calculadora em português para entender os custos de impressão por filamento (FDM/FFF), feita para iniciantes, uso pessoal e renda extra. A venda é opcional. FEITO COM AJUDA DE IA.

## Abrir sem instalar nada

1. Baixe e extraia a pasta completa do projeto.
2. Abra `index.html` no Chrome, Edge ou Firefox.
3. Preencha tempo, preço do rolo e consumo em gramas. A primeira abertura começa vazia. O botão **Usar exemplo** é opcional; seus valores são fictícios, não recomendações. Energia e outros custos ficam recolhidos e só entram quando ativados. O resultado lista as categorias não incluídas.
4. Use **Salvar orçamento** para guardar no navegador e **Baixar dados** para criar uma cópia em JSON.

Não abra o HTML dentro do ZIP: extraia todos os arquivos primeiro. Nenhuma biblioteca, conta, API, serviço de inteligência artificial ou conexão externa é necessária para calcular. Pelo endereço de um site ou servidor local, o armazenamento e a cópia de texto são mais previsíveis do que em `file://`.

## O que está incluído

- Preço do rolo, peso líquido, frete, desconto e consumo em gramas; vários materiais com custos diferentes.
- Horas e minutos de impressão; quantidade do trabalho e custo médio por peça.
- Energia por potência média e tarifa em R$/kWh, ou diretamente pelo consumo medido em kWh.
- Cadastro local de até 30 filamentos, com preço, peso do rolo, frete e desconto. Salvar pelo mesmo nome atualiza o cadastro; carregar um filamento mantém o consumo do trabalho atual.
- Tema escuro, formulário direto, sem página promocional; custos avançados recolhidos e botão **Novo cálculo**.
- Desgaste da impressora, valor residual e reserva de manutenção por hora.
- Tempo ativo de preparação, modelagem e acabamento, com valor da hora.
- Rateio opcional dos custos fixos por horas produtivas mensais.
- Reserva percentual para falhas, insumos, embalagem e entrega.
- Venda opcional com margem sobre o preço, taxas percentuais, impostos informados e taxa fixa por pedido. Taxas e impostos começam em zero, sem inferir isenção.
- Histórico de até 20 orçamentos, rascunho válido salvo automaticamente, importação/exportação JSON, resumo para copiar e impressão pelo navegador (inclusive “Salvar como PDF”, quando disponível).
- Importação assistida de alguns cabeçalhos textuais de G-code do OrcaSlicer/PrusaSlicer. O usuário confere e aplica peso e tempo. Sem executar comandos da impressora.
- Interface responsiva, navegação por teclado, mensagens de validação e atalho ao resultado no celular.

## Como preencher sem contar custos duas vezes

Todos os consumos, tempos e extras correspondem ao **trabalho inteiro**, não a uma peça. A quantidade apenas divide o total. Para várias mesas de impressão, some os consumos e tempos antes de preencher. O custo por peça é uma média: se as peças forem diferentes, faça orçamentos separados quando precisar precificar cada uma.

Use o peso líquido do filamento, sem o carretel. O preço do rolo é antes do desconto informado no campo próprio. Se digitou o preço já com desconto, deixe desconto zero. Divida o frete da compra entre os rolos. Inclua suportes, brim, torre de purga e descarte do fatiador uma única vez no consumo.

Digite `1000` para mil; `10,50` ou `10.50` para dez e cinquenta. Não use separadores de milhar. Ponto e vírgula são tratados como separadores decimais, nunca como milhares.

Use a potência média, preferencialmente medida, e a tarifa variável efetiva da conta. Não trate a potência máxima da fonte como consumo constante. Impressora, manutenção, energia e vida útil variam com máquina, material, temperatura e uso. Ao desativar uma categoria, ela deixa de entrar no custo. Trabalho manual é tempo ativo, não toda a duração da impressão.

Sem impressora, mantenha **Estou simulando** marcado. Compare cenários, depois ajuste com dados reais. Mudar o rótulo para “Seus dados” é uma declaração do usuário, não uma verificação automática de que tudo foi medido.

## Fórmulas auditáveis

| Item | Cálculo |
| --- | --- |
| Material | `(preço + frete − desconto) / peso líquido do rolo × consumo em g`, somado para cada material |
| Energia | `W médios / 1000 × horas × R$/kWh`, ou `kWh medidos × R$/kWh` |
| Desgaste | `(valor da máquina − revenda estimada) / vida útil em horas × horas do trabalho` |
| Manutenção | `reserva em R$/h × horas` |
| Fixos | `custos mensais / horas produtivas mensais × horas` |
| Trabalho ativo | `(preparação + acabamento em minutos) / 60 × R$/h` |
| Custo de impressão | `material + energia + desgaste + manutenção + fixos` |
| Reserva para falhas | `custo de impressão × percentual` |
| Custo total | `impressão + reserva + trabalho + insumos + embalagem + entrega` |
| Venda | `(custo total + taxa fixa) / (1 − margem − taxas percentuais − impostos percentuais)` |

Percentuais são convertidos em frações (25% = 0,25). A reserva para falhas é um acréscimo explícito, **não** uma probabilidade estatística de falha ou garantia de cobertura. Não é aplicada ao trabalho manual, embalagem, insumos e entrega. A sobra considera apenas os custos declarados. Não é apuração fiscal.

Margem não é markup: com custo de R$ 75 e margem de 25%, sem taxas, o preço é R$ 100. Somar 25% ao custo daria R$ 93,75 (margem de 20%). Margem + taxas + impostos precisam ser menores que 100%. O modelo aplica os percentuais ao total da venda, inclusive frete, e não cobre bases tributárias distintas, faixas, limites ou regras específicas de plataformas. Um encargo mensal fixo pertence ao rateio, sem duplicar em percentuais.

Os cálculos usam precisão completa; o total de venda é arredondado para cima ao centavo para não reduzir a margem. Linhas de custo são arredondadas somente para exibição, podendo haver diferença de centavos ao somá-las. Divisões por peça são médias; use o total do pedido na cobrança. Desgaste e reservas são provisões, não desembolsos desta impressão.

## G-code: compatibilidade e limites

Leitura local de `.gcode` textual de até 50 MB, com um material. Reconhece `filament used [g]`/`total filament used [g]` e tempos em `estimated printing time (normal mode)`, `model printing time` ou `total estimated time`, com `=` ou `:`. O tempo total tem prioridade quando reconhecido. A duração é arredondada para cima ao minuto. Cabeçalhos variam entre versões e exportações: sempre confira no fatiador. Arquivos com listas de vários materiais são recusados para não misturar seus preços. Um peso total sem informação individual não permite reconstruir custos de materiais diferentes: use a entrada manual.

Não lê STL, 3MF, `.gcode.3mf`, G-code binário, comprimento convertido em massa ou G-code sem metadados reconhecidos. Não simula movimentos, não faz o fatiamento e não calcula tempo/peso a partir de geometria. Importar apenas preenche peso e tempo após confirmação e mantém a quantidade informada. Confira suportes, purga, aquecimento e outras parcelas incluídas pelo seu fatiador.

## Dados e privacidade

O aplicativo não envia valores, arquivos ou orçamentos para servidores e não inclui rastreadores, fontes remotas ou scripts de terceiros. O provedor de hospedagem pode registrar acessos HTTP ao site, independentemente do aplicativo. Os dados do navegador pertencem ao endereço/origem: um arquivo local e o GitHub Pages não compartilham o mesmo armazenamento.

`localStorage` pode ser bloqueado, apagado pela limpeza do navegador ou perdido no modo privado. Há aviso quando a gravação falha. O rascunho só é gravado quando o cálculo é válido. O cadastro de filamentos também fica neste navegador. O JSON guarda apenas o orçamento aberto e os filamentos usados nele, não toda a biblioteca; para preservar todos, exporte cada um. **Não envie seus JSON pessoais ao repositório público.** Importações são validadas e não executam conteúdo. Campos incompletos de grupos desativados voltam aos valores de exemplo desse grupo ao normalizar um arquivo salvo; revise antes de reativá-los.

## Publicar no GitHub e abrir como site

1. Crie um repositório público chamado `camada-3d` (ou escolha outro nome).
2. Envie o **conteúdo desta pasta**, com `index.html` na raiz, não o ZIP e nem uma pasta extra envolvendo os arquivos. Não envie backups pessoais. Pela interface web, habilite a visualização de arquivos ocultos se quiser incluir `.github` e `.nojekyll`; o site básico funciona sem eles.
3. No repositório, abra **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**; selecione `main` e `/(root)`; salve.
5. Aguarde a implantação e use o endereço mostrado pelo próprio GitHub em **Visit site**.

Os caminhos são relativos e funcionam em páginas de repositório. Não há etapa de build ou dependências a instalar. O arquivo `.github/workflows/tests.yml` executa os testes em pushes e pull requests; a publicação pelo Pages é configurada na interface e não depende desse teste automaticamente.

Referência oficial: [Criar um site GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site). O repositório precisa ser público para Pages no GitHub Free. A publicação só está concluída quando houver repositório, implantação bem-sucedida e URL confirmados.

## Desenvolvimento

Node.js 20 ou superior, sem instalar pacotes:

```sh
node server.cjs
# http://127.0.0.1:4173
node --test tests/calculator.test.cjs
```

`index.html`: interface; `styles.css`: visual e impressão; `calculator.js`: cálculos, validação e leitura de metadados; `app.js`: interação e armazenamento. `server.cjs` é apenas para pré-visualização local.

Os testes cobrem cenários conhecidos, precisão, arredondamento, valores inválidos, vários materiais, taxas, serialização, metadados e 1.000 combinações determinísticas. Veja [VALIDACAO.md](VALIDACAO.md) para o que foi conferido e os limites.

## Referências e licença

Implementação original, sem copiar código ou imagens das referências:

- [gfBarreto/orcamento-3d](https://github.com/gfBarreto/orcamento-3d): referência de importação de G-code e resumo.
- [GabrielZXglitch/calculadora-de-impressao-3d](https://github.com/GabrielZXglitch/calculadora-de-impressao-3d) e [demonstração](https://calculadoradeimpressao3d.vercel.app/): referência de categorias de custos.
- [Calculadora de custos da Prusa](https://blog.prusa3d.com/3d-printing-price-calculator_38905/): referência conceitual para separar material, energia, preparação, trabalho e manutenção.

Licença MIT para o código original deste projeto; consulte [LICENSE](LICENSE). Contribuições são bem-vindas. Ao mudar fórmulas, explique a hipótese, acrescente um caso verificável e rode os testes.
