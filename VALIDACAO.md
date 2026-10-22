# Validação da versão 1.0

Verificado em 22 de outubro de 2026.

## Cálculos e entradas

40 testes automatizados aprovados com Node.js 24.19.0. Um dos testes verifica 1.000 cenários determinísticos. A suíte cobre material, rolos de diferentes pesos, frete/desconto, vários filamentos, quantidade, energia, tempo ativo, desgaste, manutenção, rateio, reserva, taxas, margem, arredondamento, backup e cabeçalhos de G-code. Testa rejeição de campos vazios, infinitos, valores negativos, divisões por zero, quantidade fracionária, minutos inválidos e taxas incompatíveis.

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

## Limites da validação

Os testes reduzem erros, mas não garantem ausência de defeitos. Não houve medição em uma impressora real, comparação com gastos reais, auditoria tributária ou teste em todos os navegadores/dispositivos. G-code foi testado com cabeçalhos de amostra; não há garantia de suporte a todas as versões de fatiadores. O botão de impressão usa o diálogo e as opções de PDF do navegador; paginação pode variar conforme navegador, papel e configurações do usuário. O layout de impressão foi implementado, mas um PDF gerado pelo diálogo não foi revisado nesta validação.

O GitHub Pages, quando publicado, deve ser conferido pelo endereço de implantação retornado pelo GitHub. O processo de testes automatizados no GitHub é separado da publicação por branch.
