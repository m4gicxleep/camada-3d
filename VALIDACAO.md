# Validação da versão 1.1

Verificado em 22 de outubro de 2026.

## Cálculos e entradas

64 testes automatizados aprovados com Node.js 24.19.0: 40 da calculadora e 24 do controle mensal. Um dos testes verifica 1.000 cenários determinísticos. A suíte cobre material, rolos de diferentes pesos, frete/desconto, vários filamentos, quantidade, energia, tempo ativo, desgaste, manutenção, rateio, reserva, taxas, margem, arredondamento, backup e cabeçalhos de G-code. Testa rejeição de campos vazios, infinitos, valores negativos, divisões por zero, quantidade fracionária, minutos inválidos e taxas incompatíveis.

O exemplo inicial foi conferido: R$ 10 em material + R$ 0,48 em energia + R$ 2 em desgaste + R$ 0,40 em manutenção = R$ 12,88. Reserva de 10%: R$ 1,288. Total: R$ 14,168, exibido como R$ 14,17.

## Navegador

- Página servida localmente com HTTP 200; arquivos JavaScript passaram na verificação de sintaxe.
- Revisão visual em computador e largura de celular de 390 px, sem transbordamento horizontal.
- Campo quantidade zero bloqueia salvar e exibe erro; correção recupera o cálculo.
- Entrada decimal com vírgula funciona.
- Ativar venda revela margem e taxas; soma inválida bloqueia o resultado.
- Adicionar um segundo material de 50 g a R$ 200/kg acrescenta R$ 10 de material e R$ 1 de reserva no cenário testado; removê-lo restaura o resultado.
- Salvar e recarregar mantém rascunho e histórico.
- Resumo copiado conferido na área de transferência.
- Importação de G-code de teste: 80,25 g e 2h 10m 5s exibidos como 2h 11m para confirmação; aplicar atualiza os campos.
- Importação JSON válida confirmada pela interface restaura o custo do exemplo (R$ 14,17).
- Nenhum erro/aviso de JavaScript registrado durante os testes realizados.

## Interface simplificada e funções adicionais

Tema escuro e formulário direto, com custos extras recolhidos. A primeira abertura sem dados salvos inicia com preço, consumo e tempo vazios; não mostra total até preenchê-los.

Testado no navegador: salvar um filamento, alterar seu preço e recarregar o cadastro restaura R$ 100/kg. Consumo medido de 0,75 kWh com tarifa de R$ 1,20 resulta em R$ 0,90 de energia; total do cenário com reserva: R$ 14,63.

Testes adicionais cobrem energia medida, consumo inválido, modo desconhecido, restauração de backups antigos e cálculo inicial incompleto.

## Controle mensal da impressora

- Orçamentos anteriores permanecem orçamentos. Converter um orçamento em venda mantém uma cópia dos valores e marca a origem como vendida. O mesmo orçamento não gera duas vendas ativas; abrir o cálculo permite criar outro trabalho.
- Até 500 orçamentos e 5.000 registros em cada lista financeira. Não há exclusão automática ao virar o mês. Vendas e gastos podem ser editados, cancelados e restaurados.
- O total da impressora inclui entrada e valores financiados, com juros/frete informados pelo usuário. O restante é dividido em 1 a 120 parcelas mensais, inicialmente 12; ajuste de centavos na última parcela. O programa não calcula juros de um financiamento.
- A entrada informada é considerada já paga em sua data. Parcelas só contam no saldo quando marcadas como pagas, pela data efetiva, inclusive quando o pagamento ocorrer em outro mês. Com pagamentos registrados, valores e meses da compra ficam protegidos contra alteração acidental; é necessário desfazer as marcações primeiro. O nome pode ser editado.
- Lucro estimado = soma das vendas do mês da venda − taxas informadas − custos congelados dos orçamentos. Inclui vendas ainda a receber. Não é lucro contábil ou apuração fiscal e não soma novamente as compras de rolos às gramas já orçadas.
- Recebimento líquido = valor integral recebido − taxas informadas, no mês do recebimento. Saldo do mês = recebimentos líquidos − despesas pagas − entrada − parcelas efetivamente pagas. Não inclui saldo inicial ou acumulado de meses anteriores. Para um saldo completo, o usuário precisa registrar os gastos efetivos, inclusive energia. Reservas, desgaste e tempo próprio não são lançados automaticamente como pagamentos.
- Meta da parcela = parcela prevista para o mês. Cobertura usa os recebimentos líquidos menos despesas e entrada, antes das parcelas; cobrir a meta não comprova pagamento. O saldo desconta todos os pagamentos efetivamente feitos no mês, mesmo de parcelas de outros meses.
- Recebimento integral apenas; pagamentos parciais de clientes não são modelados. Multas/encargos extras da parcela podem ser registrados como despesa adicional.
- Backup completo validado antes de substituir dados; contém impressora, pagamentos, vendas, gastos, orçamentos, filamentos e rascunho válido. Os registros permanecem privados no armazenamento local, sem sincronização ou envio ao GitHub. Arquivos de backup foram incluídos no `.gitignore`.

Conferido pela interface: impressora de R$ 2.400 em 12x de R$ 200; venda de R$ 300, custo do orçamento R$ 10, compra de rolo R$ 100. Resultado estimado R$ 290; disponível antes da parcela R$ 200; saldo após pagar a parcela R$ 0. Ao marcar a venda como a receber, o recebimento cai a zero e o saldo passa a −R$ 300, mantendo a estimativa da venda separada. Recarga mantém os registros; novembro começa sem os recebimentos/gastos de outubro e mostra a segunda parcela.

Também conferidos: restauração de backup completo, rejeição de backup inválido sem alterar os registros existentes, cópia do backup para a área de transferência com todas as listas, proteção de parcelamento já pago, uso do valor da impressora na calculadora, layout em 1280 px e 390 px sem transbordamento horizontal. Nenhum erro de JavaScript registrado durante essas verificações. O navegador integrado não sinalizou a conclusão do download automático de Blob; foi incluído um diálogo com link direto e alternativa de copiar o conteúdo, cuja cópia foi verificada. Os valores usados nos testes foram fictícios e ficaram somente na prévia local.

## Limites da validação

Os testes reduzem erros, mas não garantem ausência de defeitos. Não houve medição em uma impressora real, comparação com gastos reais, auditoria tributária ou teste em todos os navegadores/dispositivos. G-code foi testado com cabeçalhos de amostra; não há garantia de suporte a todas as versões de fatiadores. O botão de impressão usa o diálogo e as opções de PDF do navegador; paginação pode variar conforme navegador, papel e configurações do usuário. O layout de impressão foi implementado, mas um PDF gerado pelo diálogo não foi revisado nesta validação.

O GitHub Pages, quando publicado, deve ser conferido pelo endereço de implantação retornado pelo GitHub. O processo de testes automatizados no GitHub é separado da publicação por branch.
