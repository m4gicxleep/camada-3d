# Camada 3D

## Cálculo mais simples

Novos cálculos incluem uma estimativa editável de R$ 0,10 por hora para energia e reserva de 10% para falhas. Esse valor por hora é uma hipótese inicial, não uma medição específica da A1 ou A1 mini: o gasto depende da tarifa local e da impressão. Em **Custos padrão e detalhes**, você pode usar potência ou kWh medidos e salvar seus custos para os próximos trabalhos. O backup completo inclui esses padrões.

Projeto pessoal de uma calculadora de custos de impressão 3D, para uso próprio e para quem também quiser usar.

**FEITO COM AJUDA DE IA.**

## Usar a calculadora

**[Abrir calculadora online](https://m4gicxleep.github.io/camada-3d/)**

Funciona direto no navegador, no computador ou celular. Não precisa instalar, baixar nada ou criar conta.

Informe o preço do filamento, o peso usado e o tempo de impressão. Os outros custos e o preço de venda são opcionais.

Também dá para registrar orçamentos, vendas, despesas e a compra da impressora em parcelas. A aba **Impressora e mês** mostra o resultado do mês e se a renda cobriu a parcela.

Seus registros ficam apenas no seu navegador, sem serem publicados no GitHub. Use **Backup completo** para guardar uma cópia.

## Novidades da versão 1.2

- **Estoque e produção:** cadastro separado por rolo, material, marca e cor; custo de aquisição com frete e desconto; saldo em gramas e valor ainda no estoque. Alertas de saldo abaixo de 100 g e de rolos sem uso registrado há 60 dias ajudam a reaproveitar cores antes de comprar outras.
- **Cor no orçamento:** selecione um rolo para usar seu preço específico. Orçar ou vender não baixa estoque. O consumo é descontado apenas ao fechar a produção. Rolos arquivados mantêm seus registros e podem ser reativados.
- **Perdas adicionais:** informe somente gramas fora do total do fatiador. Suportes e purga já incluídos nesse total não devem ser somados novamente.
- **Reserva para cor específica:** provisão opcional em reais para a parte do saldo que você estima não reaproveitar. Não cobra automaticamente um rolo inteiro, não baixa estoque e não é uma despesa paga. Combine as condições com o cliente; não repita material, frete ou perdas já cobrados.
- **Lotes:** quantidade, tempo e consumo referem-se ao trabalho inteiro. Embalagem pode ser do pedido ou por peça. O preço mínimo é um piso de venda, sem ser somado ao custo.
- **Orçamento para cliente:** botão próprio copia quantidade, material/cor, preço total, média por peça e entrega, sem expor custos internos. Prazo, validade e pagamento ficam a combinar antes do envio.
- **Sinal e saldo:** até 120 recebimentos por venda, cada um com data, valor bruto e taxa efetiva. O caixa usa as datas e taxas dos recebimentos. Para quitar, as somas precisam conferir com o total e com as taxas da venda. Vendas antigas integralmente recebidas continuam compatíveis.
- **Previsto × realizado:** registre o consumo e o tempo de todas as tentativas, peças boas, falhas e observações. Você pode fechar o cálculo atual ou uma venda, pelo botão “Fechar produção”. Cada venda aceita um fechamento ativo; edite-o para incluir todas as tentativas, sem lançar o mesmo consumo de novo.
- **Resultado mensal:** mostra separadamente lucro estimado, sobra das vendas com produção registrada e dinheiro recebido. Reservas de falha e cor não entram no custo realizado. Energia por potência, desgaste e custos fixos continuam estimativas, mesmo no fechamento.
- **Arquivos fatiados:** aceita `.gcode` textual e `.gcode.3mf` com uma mesa e um filamento, até 50 MB. O 3MF precisa conter G-code já fatiado; um projeto com apenas o modelo não basta. O conteúdo é verificado por tamanho e CRC. Revise os valores antes de aplicar. Não há envio do arquivo a servidores.
- **Backup:** inclui estoque, produções e recebimentos. O aviso informa a última solicitação de cópia/download e mudanças nos registros. Confirme que guardou o arquivo; o navegador não garante que um download solicitado foi concluído. Alterações apenas no rascunho não disparam o aviso de mudança, mas o rascunho válido vai no backup.

## Fluxo sugerido

1. Cadastre o rolo em **Estoque e produção**, com o saldo físico atual sem o carretel. Se já pagou, registre a compra uma única vez nas despesas.
2. Na calculadora, selecione o rolo e preencha os totais do fatiador. Para partes impressas separadamente, some os tempos e o consumo de cada material. Inclua seu tempo ativo de montagem e acabamento.
3. Confira energia, manutenção, mão de obra e embalagem. Ative o preço de venda, ajuste margem, taxas efetivas do seu canal e, se necessário, o preço mínimo do pedido.
4. Registre a venda e os recebimentos. Eles não significam que a impressão aconteceu.
5. Depois de imprimir, feche a produção pela venda, incluindo todas as tentativas e perdas reais. O estoque é validado antes de gravar; saldo insuficiente bloqueia o fechamento sem alterar os dados salvos.
6. Compare a sobra após custo realizado com a previsão e faça um backup.

Editar o saldo de um rolo serve para conferência física. Não use esse ajuste para esconder consumo de impressões que falharam. “Desfazer registro” devolve as gramas ao estoque e deve ser usado só para lançamento por engano, não para falhas reais. Cancelar uma venda não devolve material consumido.

O formato é brasileiro: português, reais e vírgula decimal. Não há tabela de preços ou alíquota fiscal imposta pelo aplicativo. A sugestão depende dos custos e percentuais que você informar; ela não garante venda nem lucro. Valor unitário é uma média, e o total do pedido é a referência de cobrança.

## Executar e testar

O projeto continua sem dependências de execução. Para desenvolvimento, use Node.js 24 ou superior:

```sh
node server.cjs
node --test tests/*.test.cjs
```

Abra `http://127.0.0.1:4173`. O servidor de prévia serve apenas os arquivos públicos do aplicativo. Para uso publicado, mantenha todos os arquivos JavaScript, HTML e CSS na mesma pasta do GitHub Pages.

Backups e orçamentos da versão anterior são migrados ao carregar. Faça um backup antes de atualizar. Dados de outro domínio, navegador ou endereço local não aparecem automaticamente no GitHub Pages; use o backup completo para transferi-los.
