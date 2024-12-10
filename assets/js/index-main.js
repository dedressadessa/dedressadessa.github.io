let eletrodomesticos

$(document).ready(function () {
    const CO2_EMISSION_FACTOR = 0.0385
    const ITEMS_PER_PAGE = 3;
    let currentPage = 1;

    function getEletrodomesticos() {
        const data = localStorage.getItem('eletrodomesticos');
        return data ? JSON.parse(data) : [];
    }

    function saveEletrodomesticos(eletrodomesticos) {
        localStorage.setItem('eletrodomesticos', JSON.stringify(eletrodomesticos));
    }

    eletrodomesticos = getEletrodomesticos();

    $('#qtdEletrodomesticos').html(`${eletrodomesticos.length} ${eletrodomesticos.length == 0 || eletrodomesticos.length > 1 ? '<small>eletrodomésticos</small>' : '<small>eletrodoméstico</small>'}`)

    $('#formCadastro').submit(function (event) {
        event.preventDefault()

        const nome = $('#nome').val()
        const potencia = parseFloat($('#potencia').val())
        const tempoUso = parseFloat($('#tempoUso').val())

        // Consumo (kWh) = Potência (W) x Tempo de uso (h) / 1.000

        const consumoDiario = (potencia * tempoUso) / 1000 // kWh/Dia
        const consumoMensal = (potencia * tempoUso * 30) / 1000 // kWh/Mês

        let classificacaoEficiencia
        if (consumoMensal <= 10) {
            classificacaoEficiencia = "A"
        } else if (consumoMensal <= 20) {
            classificacaoEficiencia = "B"
        } else if (consumoMensal <= 50) {
            classificacaoEficiencia = "C"
        } else {
            classificacaoEficiencia = "D"
        }

        const eletro = { nome, potencia, classificacaoEficiencia, tempoUso, consumoDiario, consumoMensal }
        eletrodomesticos.push(eletro)

        saveEletrodomesticos(eletrodomesticos);

        $('#initialTableAlert').hide()

        atualizarLista()
        atualizarRelatorio()
        atualizarGrafico()

        $('#qtdEletrodomesticos').html(`${eletrodomesticos.length} ${eletrodomesticos.length == 0 || eletrodomesticos.length > 1 ? '<small>eletrodomésticos</small>' : '<small>eletrodoméstico</small>'}`)

        Swal.fire({
            icon: 'success',
            position: "center",
            title: 'Concluído',
            text: 'O eletrodoméstico foi registrado!',
            heightAuto: false,
            showConfirmButton: false,
            timer: 1500
        })

        $('#collapseCreate').collapse('hide')
        $(this).trigger("reset")
    })

    function atualizarLista() {
        const lista = $('#listaEletrodomesticos tbody');
        lista.empty();

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageItems = eletrodomesticos.slice(startIndex, endIndex);

        if (pageItems.length === 0) {
            $('#initialTableAlert').show();
        } else {
            $('#initialTableAlert').hide();
            pageItems.forEach((eletro, index) => {
                const detalhesBtn = $('<button class="btn btn-sm btn-success btnAcao" style="margin-left: 10px;"><i style="font-size: 15px;" class="bx bx-detail"></i></button>')
                    .click(() => mostrarDetalhes(eletro));

                const destroyBtn = $('<button class="btn btn-sm btn-danger btnAcao" style="margin-left: 10px"><i style="font-size: 15px" class="bx bx-trash"></i></button>')
                    .click(() => removerEletrodomestico(index));
                const listItem = $('<tr>');
                listItem.append(`<th>${startIndex + index + 1}</th>`);
                listItem.append(`<td><span class="badge bg-label-success rounded-pill">${eletro.nome}</span></td>`);
                listItem.append(`<td>${eletro.tempoUso} horas</td>`);
                listItem.append(`<td>${eletro.consumoDiario.toFixed(2)} kWh</td>`);
                listItem.append(`<td>${eletro.consumoMensal.toFixed(2)} kWh</td>`);
                listItem.append($('<td>').append(detalhesBtn, destroyBtn));
                lista.append(listItem);
            });
        }

        atualizarControlesPaginacao();
    }

    function atualizarControlesPaginacao() {
        const paginationControls = $('#paginationControls');
        paginationControls.empty();

        const totalPages = Math.ceil(eletrodomesticos.length / ITEMS_PER_PAGE);

        if (totalPages <= 1) return;
        if (currentPage >= 1) {
            $('<button>')
                .addClass(`btn btn-success ${currentPage == 1 ? 'disabled' : ''}`)
                .text('Anterior')
                .on('click', () => {
                    currentPage--;
                    atualizarLista();
                })
                .appendTo(paginationControls);
        }

        for (let i = 1; i <= totalPages; i++) {
            $('<button>')
                .addClass("btn btn-outline-success")
                .text(i)
                .toggleClass('active', i === currentPage)
                .on('click', () => {
                    currentPage = i;
                    atualizarLista();
                })
                .appendTo(paginationControls);
        }

        if (currentPage <= totalPages) {
            $('<button>')
                .addClass(`btn btn-success ${currentPage == totalPages ? 'disabled' : ''}`)
                .text('Próximo')
                .on('click', () => {
                    currentPage++;
                    atualizarLista();
                })
                .appendTo(paginationControls);
        }
    }

    function mostrarDetalhes(eletro) {
        $('#titleNomeEletro').text(eletro.nome)
        $('#spanTempoDiario').text(eletro.tempoUso)
        $('#spanConsumoDiario').text(eletro.consumoDiario.toFixed(2))
        $('#spanConsumoMensal').text(eletro.consumoMensal.toFixed(2))
        $('#classificacaoEficiencia').text(classificarEficiencia(eletro.consumoMensal))
        $('#modalDetalhes').fadeIn()
    }

    $('.close').click(() => $('#modalDetalhes').fadeOut())

    function classificarEficiencia(consumoMensal) {
        if (consumoMensal <= 10) return "A (Muito eficiente)"
        else if (consumoMensal <= 20) return "B (Eficiente)"
        else if (consumoMensal <= 50) return "C (Moderado)"
        else return "D (Pouco eficiente)"
    }

    function atualizarRelatorio() {
        let totalConsumo = 0;
        let maisEconomico = { nome: '', consumoMensal: Infinity };
        let menosEconomico = { nome: '', consumoMensal: 0 };

        eletrodomesticos.forEach(eletro => {
            totalConsumo += eletro.consumoMensal;

            if (eletro.consumoMensal < maisEconomico.consumoMensal) {
                maisEconomico = eletro;
            }

            if (eletro.consumoMensal > menosEconomico.consumoMensal) {
                menosEconomico = eletro;
            }
        });

        const emissaoCO2 = totalConsumo * CO2_EMISSION_FACTOR;

        // Cálculo das porcentagens
        const maisEconomicoPorcentagem = ((maisEconomico.consumoMensal / totalConsumo) * 100).toFixed(2)
        const menosEconomicoPorcentagem = ((menosEconomico.consumoMensal / totalConsumo) * 100).toFixed(2)
        const diferencaPorcentagem = (((menosEconomico.consumoMensal - maisEconomico.consumoMensal) / menosEconomico.consumoMensal) * 100).toFixed(2)

        // Atualiza os textos dos cards com os novos valores
        $('#totalGasto').text(`Consumo Total: ${totalConsumo.toFixed(2)} kWh`)
        $('#eletroMaisConsumo').text(`Eletrodoméstico que mais consome: ${menosEconomico.nome}`)
        $('#emissaoCO2').text(`Emissão de CO₂ estimada: ${emissaoCO2.toFixed(2)} kg`)

        // Atualiza os cards de mais e menos econômicos com porcentagens
        if (maisEconomico.nome !== '' && menosEconomico.nome !== '') {
            $('#eletroMaisEconomico').text(maisEconomico.nome)
            $('#eletroMenosEconomico').text(menosEconomico.nome)

            if (eletrodomesticos.length > 1) {
                $('#alertMaisEconomico').show()
                $('#alertMenosEconomico').show()
            } else {
                $('#alertMaisEconomico').hide()
                $('#alertMenosEconomico').hide()
            }
            $('#chartEficiency').show()
        } else {
            $('#eletroMaisEconomico').text('Indisponível')
            $('#eletroMenosEconomico').text('Indisponível')

            $('#alertMaisEconomico').hide()
            $('#alertMenosEconomico').hide()
            $('#chartEficiency').hide()
        }


        // Mostra as porcentagens nos elementos pequenos abaixo do nome
        $('#eletroMaisEconomico').next().html(`<small class="text-success fw-medium"><i class="bx bx-up-arrow-alt"></i> ${maisEconomicoPorcentagem}% do total</small>`);
        $('#eletroMenosEconomico').next().html(`<small class="text-danger fw-medium"><i class="bx bx-down-arrow-alt"></i> Consome ${diferencaPorcentagem}% a mais</small>`);

        $('#qtdEletrodomesticos').html(`${eletrodomesticos.length} ${eletrodomesticos.length == 0 || eletrodomesticos.length > 1 ? '<small>eletrodomésticos</small>' : '<small>eletrodoméstico</small>'}`);
        $('#qtdEmissaoCO2').html(`${emissaoCO2.toFixed(2)} <small>kg</small>`);
        $('#qtdConsumoDiario').html(`${totalConsumo.toFixed(2)} <small>kWh</small>`);

        $('#chartTotalEletrodomesticos').text(`${eletrodomesticos.length}`)
    }

    function removerEletrodomestico(index) {
        Swal.fire({
            icon: "warning",
            title: "Você tem certeza?",
            text: 'Isso irá remover o eletrodoméstico da base de dados',
            showCancelButton: true,
            confirmButtonText: "Sim, deletar",
            heightAuto: false,
            customClass: {
                confirmButton: 'btn btn-warning me-3',
                cancelButton: 'btn btn-secondary'
            },
        }).then((result) => {
            if (result.isConfirmed) {
                const realIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
    
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso',
                    text: 'O eletrodoméstico foi deletado',
                    showConfirmButton: true,
                    heightAuto: false,
                    customClass: {
                        confirmButton: 'btn btn-success me-3',
                    },
                });
    
                eletrodomesticos.splice(realIndex, 1);
                if ((currentPage - 1) * ITEMS_PER_PAGE >= eletrodomesticos.length && currentPage > 1) {
                    currentPage--;
                }
    
                saveEletrodomesticos(eletrodomesticos);
                atualizarLista();
                atualizarRelatorio();
    
                $('#qtdEletrodomesticos').html(`${eletrodomesticos.length} ${eletrodomesticos.length == 0 || eletrodomesticos.length > 1 ? '<small>eletrodomésticos</small>' : '<small>eletrodoméstico</small>'}`);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                Swal.fire({
                    icon: 'info',
                    position: "center",
                    title: 'Ação cancelada',
                    text: 'O eletrodoméstico não será deletado',
                    showConfirmButton: false,
                    heightAuto: false,
                    timer: 2000
                });
            }
        });
    }

    atualizarLista()
    atualizarRelatorio()
    atualizarGrafico()
});


function atualizarGrafico() {
    const countByClassification = eletrodomesticos.reduce((acc, item) => {
        acc[item.classificacaoEficiencia] = (acc[item.classificacaoEficiencia] || 0) + 1;
        return acc;
    }, { A: 0, B: 0, C: 0, D: 0 });

    const total = eletrodomesticos.length;
    const series = ['A', 'B', 'C', 'D'].map(classe =>
        Number(((countByClassification[classe] / total) * 100).toFixed(2)) || 0
    );
    const chartEficiency = document.querySelector('#chartEficiency');
    const orderChartConfig = {
        chart: { height: 145, width: 110, type: 'donut' },
        labels: ['A', 'B', 'C', 'D'],
        series: series,
        colors: [config.colors.success, config.colors.warning, config.colors.danger, config.colors.dark],
        stroke: { width: 5, colors: [config.colors.cardColor] },
        dataLabels: { enabled: false },
        legend: { show: false },
        grid: { padding: { top: 0, bottom: 0, right: 15 } },
        plotOptions: {
            pie: {
                donut: {
                    size: '75%',
                    labels: {
                        show: true,
                        value: { fontSize: '18px', fontFamily: 'Public Sans', fontWeight: 500, color: config.colors.headingColor, offsetY: -17 },
                        name: { offsetY: 17, fontFamily: 'Public Sans' },
                        total: { show: true, fontSize: '12px', color: config.colors.bodyColor, label: 'Total', formatter: () => '100%' }
                    }
                }
            }
        }
    }

    if (chartEficiency !== null) {
        // Remove o gráfico antigo e renderiza um novo com dados atualizados
        chartEficiency.innerHTML = ""
        const statisticsChart = new ApexCharts(chartEficiency, orderChartConfig)
        statisticsChart.render()
    }

    ['A', 'B', 'C', 'D'].forEach((classe, index) => {
        document.querySelectorAll('.user-progress h6')[index].textContent = countByClassification[classe] || 0;
    })
}

// Navegação de páginas
//___________________________________________________________________________________________________________
function showPage(pageId) {
    if (pageId == 'relatorioContent') {
        $('#btnNovoEletro').addClass('hidden')
        $('#collapseCreate').collapse('hide')
        $('#formCadastro').trigger("reset")

        atualizarGrafico()
    } else {
        $('#btnNovoEletro').removeClass('hidden')
    }
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none'
    });

    document.getElementById(pageId).style.display = 'block'
}

// Manipulação da janela MAC
//___________________________________________________________________________________________________________
const macWindow = document.getElementById("macWindow"),
    windowContent = document.getElementById("windowContent"),
    reopenButton = document.getElementById("reopenButton")

let isMinimized = false

function closeWindow() {
    macWindow.classList.add("hidden")
    setTimeout(() => {
        macWindow.style.display = "none"
        $(reopenButton).attr('style', 'display: block !important')
    }, 300)
}

function toggleMinimizeWindow() {
    const macWindow = document.getElementById("macWindow");
    const windowHeight = window.innerHeight;
    const macWindowHeight = macWindow.offsetHeight;

    if (isMinimized) {
        macWindow.classList.remove("minimized");
        macWindow.style.removeProperty("--minimized-position");
    } else {
        const minimizeOffset = Math.min(windowHeight - macWindowHeight / 4, windowHeight * 0.77);
        macWindow.style.setProperty("--minimized-position", `${minimizeOffset}px`);
        macWindow.classList.add("minimized");
    }
    isMinimized = !isMinimized;
}

function maximizeWindow() {
    macWindow.classList.toggle("fullscreen")
}

function openWindow() {
    macWindow.style.display = "block"
    $(reopenButton).removeAttr('style')
    setTimeout(() => {
        macWindow.classList.remove("hidden")
    }, 10);
}

window.onload = () => {
    windowContent.style.display = "block"
}