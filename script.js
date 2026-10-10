const raiz = document.documentElement;
const botaoTema = document.querySelector(".botao-tema");
let temaSalvo = "dark";
try {
    temaSalvo = localStorage.getItem("portfolio-theme") === "light" ? "light" : "dark";
} catch { /* O tema também funciona quando o armazenamento está bloqueado. */ }

function aplicarTema(tema) {
    const temaClaro = tema === "light";

    raiz.dataset.theme = tema;
    botaoTema.setAttribute("aria-pressed", String(temaClaro));
    botaoTema.setAttribute(
        "aria-label",
        temaClaro ? "Ativar modo escuro" : "Ativar modo claro"
    );
}

aplicarTema(temaSalvo);

botaoTema.addEventListener("click", () => {
    const proximoTema = raiz.dataset.theme === "dark" ? "light" : "dark";

    aplicarTema(proximoTema);
    try { localStorage.setItem("portfolio-theme", proximoTema); } catch { /* Sem persistência. */ }
});

const telaCelular = window.matchMedia("(max-width: 860px)");
const menu = document.querySelector(".menu-cabecalho");
const botaoMenu = document.querySelector(".botao-menu");
const botaoFecharMenu = document.querySelector(".fechar-menu");
const fundoMenu = document.querySelector(".fundo-menu");
const conteudoPrincipal = document.querySelector("main");
const logo = document.querySelector(".logo");

function definirMenuAberto(abrir, restaurarFoco = true) {
    const estaAberto = abrir && telaCelular.matches;
    menu.classList.toggle("aberto", estaAberto);
    document.body.classList.toggle("menu-aberto", estaAberto);
    botaoMenu.setAttribute("aria-expanded", String(estaAberto));
    fundoMenu.hidden = !estaAberto;
    menu.inert = telaCelular.matches && !estaAberto;
    conteudoPrincipal.inert = estaAberto;
    logo.inert = estaAberto;
    botaoMenu.inert = estaAberto;

    if (estaAberto) {
        menu.setAttribute("role", "dialog");
        menu.setAttribute("aria-modal", "true");
        menu.setAttribute("aria-label", "Menu de navegação");
        botaoFecharMenu.focus();
    } else {
        menu.removeAttribute("role");
        menu.removeAttribute("aria-modal");
        menu.removeAttribute("aria-label");
        if (restaurarFoco && telaCelular.matches) botaoMenu.focus();
    }
}

botaoMenu.addEventListener("click", () => definirMenuAberto(true));
botaoFecharMenu.addEventListener("click", () => definirMenuAberto(false));
fundoMenu.addEventListener("click", () => definirMenuAberto(false));
menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        if (telaCelular.matches) definirMenuAberto(false);
    });
});

document.addEventListener("keydown", evento => {
    if (!menu.classList.contains("aberto")) return;
    if (evento.key === "Escape") {
        evento.preventDefault();
        definirMenuAberto(false);
    }
    if (evento.key === "Tab") {
        const controles = [...menu.querySelectorAll("a[href], button")];
        const primeiro = controles[0];
        const ultimo = controles[controles.length - 1];
        if (evento.shiftKey && document.activeElement === primeiro) {
            evento.preventDefault();
            ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault();
            primeiro.focus();
        }
    }
});

telaCelular.addEventListener("change", () => {
    const botaoFecharEstavaFocado = document.activeElement === botaoFecharMenu;
    definirMenuAberto(false, false);
    if (botaoFecharEstavaFocado && !telaCelular.matches) menu.querySelector("a").focus();
});
definirMenuAberto(false, false);

// Destaque da navegação: acompanha as seções existentes, na ordem do HTML.
const linksNavegacao = [...document.querySelectorAll(".navegacao-principal .link-navegacao")];
const secoesNavegacao = [...document.querySelectorAll("main section[id]")]
    .filter(secao => linksNavegacao.some(link => link.hash === `#${secao.id}`));
const cabecalho = document.querySelector(".cabecalho");
let secaoClicada = null;
let quadroNavegacao = null;
let temporizadorNavegacao;

function destacarSecao(id) {
    linksNavegacao.forEach(link => {
        const estaAtivo = link.hash === `#${id}`;
        link.classList.toggle("ativo", estaAtivo);
        if (estaAtivo) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
    });
}

function atualizarNavegacao() {
    quadroNavegacao = null;
    if (secaoClicada || !secoesNavegacao.length) return;

    // Considera o cabeçalho fixo e o espaço usado na navegação por âncoras.
    const linhaLeitura = cabecalho.getBoundingClientRect().bottom + 25;
    let secaoAtual = secoesNavegacao[0];
    for (const secao of secoesNavegacao) {
        if (secao.getBoundingClientRect().top <= linhaLeitura) secaoAtual = secao;
    }

    // A última seção pode ser curta demais para alcançar a linha do cabeçalho.
    const ultimaSecao = secoesNavegacao[secoesNavegacao.length - 1];
    if (window.scrollY > 0 &&
        Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2 &&
        ultimaSecao.getBoundingClientRect().top < window.innerHeight) {
        secaoAtual = ultimaSecao;
    }
    destacarSecao(secaoAtual.id);
}

function agendarAtualizacaoNavegacao() {
    if (quadroNavegacao === null) quadroNavegacao = requestAnimationFrame(atualizarNavegacao);
}

function aguardarFimRolagem() {
    clearTimeout(temporizadorNavegacao);
    temporizadorNavegacao = setTimeout(() => {
        secaoClicada = null;
        agendarAtualizacaoNavegacao();
    }, 180);
}

// Mantém o item clicado destacado durante a rolagem suave até o destino.
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", evento => {
        if (evento.defaultPrevented || evento.button !== 0 || evento.ctrlKey ||
            evento.metaKey || evento.shiftKey || evento.altKey) return;
        const destino = secoesNavegacao.find(secao => link.hash === `#${secao.id}`);
        if (!destino) return; // As seções ainda não criadas não recebem destaque.
        secaoClicada = destino.id;
        destacarSecao(destino.id);
        aguardarFimRolagem();
    });
});

window.addEventListener("scroll", () => {
    agendarAtualizacaoNavegacao();
    if (secaoClicada) aguardarFimRolagem();
}, { passive: true });
window.addEventListener("resize", agendarAtualizacaoNavegacao);
window.addEventListener("load", agendarAtualizacaoNavegacao);
window.addEventListener("pageshow", agendarAtualizacaoNavegacao);
window.addEventListener("hashchange", agendarAtualizacaoNavegacao);

// Se a pessoa interromper a rolagem automática, volta a acompanhar a posição real.
function retomarAcompanhamentoRolagem() {
    secaoClicada = null;
    clearTimeout(temporizadorNavegacao);
    agendarAtualizacaoNavegacao();
}
window.addEventListener("wheel", retomarAcompanhamentoRolagem, { passive: true });
window.addEventListener("touchstart", retomarAcompanhamentoRolagem, { passive: true });
window.addEventListener("keydown", evento => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(evento.key)) {
        retomarAcompanhamentoRolagem();
    }
});
atualizarNavegacao();

// Barras de skills: animam quando entram na tela e repetem após sair e voltar.
const barrasHabilidades = [...document.querySelectorAll(".progresso-habilidade")];
const movimentoReduzidoHabilidades = window.matchMedia("(prefers-reduced-motion: reduce)");
const animacoesHabilidades = new Map();

function atualizarPorcentagem(barra, valor) {
    barra.style.setProperty("--skill-value", `${valor}%`);
    barra.querySelector(".porcentagem-habilidade").textContent = `${Math.round(valor)}%`;
}
function pararAnimacaoHabilidade(barra) {
    if (animacoesHabilidades.has(barra)) cancelAnimationFrame(animacoesHabilidades.get(barra));
    animacoesHabilidades.delete(barra);
}
function animarHabilidade(barra) {
    pararAnimacaoHabilidade(barra);
    const porcentagemFinal = Math.min(100, Math.max(0, Number(barra.getAttribute("aria-valuenow")) || 0));
    if (movimentoReduzidoHabilidades.matches) { atualizarPorcentagem(barra, porcentagemFinal); return; }
    atualizarPorcentagem(barra, 0);
    let inicioAnimacao;
    function atualizarAnimacao(tempo) {
        if (inicioAnimacao === undefined) inicioAnimacao = tempo;
        const progresso = Math.min((tempo - inicioAnimacao) / 1200, 1);
        atualizarPorcentagem(barra, porcentagemFinal * (1 - Math.pow(1 - progresso, 3)));
        if (progresso < 1) animacoesHabilidades.set(barra, requestAnimationFrame(atualizarAnimacao));
        else animacoesHabilidades.delete(barra);
    }
    animacoesHabilidades.set(barra, requestAnimationFrame(atualizarAnimacao));
}
if ("IntersectionObserver" in window) {
    const habilidadesVisiveis = new Set();
    const observadorHabilidades = new IntersectionObserver(entradas => {
        entradas.forEach(entrada => {
            const barra = entrada.target;
            if (entrada.isIntersecting && entrada.intersectionRatio >= 0.5 && !habilidadesVisiveis.has(barra)) {
                habilidadesVisiveis.add(barra);
                animarHabilidade(barra);
            } else if (!entrada.isIntersecting) {
                habilidadesVisiveis.delete(barra);
                pararAnimacaoHabilidade(barra);
                if (!movimentoReduzidoHabilidades.matches) atualizarPorcentagem(barra, 0);
            }
        });
    }, { threshold: [0, 0.5, 1] });
    barrasHabilidades.forEach(barra => {
        if (!movimentoReduzidoHabilidades.matches) atualizarPorcentagem(barra, 0);
        observadorHabilidades.observe(barra);
    });
    document.querySelectorAll('a[href="#skills"]').forEach(link => {
        link.addEventListener("click", evento => {
            if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
            habilidadesVisiveis.forEach(animarHabilidade);
        });
    });
}
movimentoReduzidoHabilidades.addEventListener("change", () => {
    if (movimentoReduzidoHabilidades.matches) barrasHabilidades.forEach(animarHabilidade);
});

// Linha do tempo reversível pela posição da página, não pela direção isolada.
// Ao descer: Minas, Alavanca, Conta Azul. Ao subir: a ordem inversa.
const linhaTempo = document.querySelector(".linha-tempo-eventos");
if (linhaTempo) {
    const itensEventos = [...linhaTempo.querySelectorAll(".evento-item")];
    const movimentoReduzidoEventos = window.matchMedia("(prefers-reduced-motion: reduce)");
    let quadroEventos = null;

    function atualizarLinhaTempo() {
        quadroEventos = null;
        if (movimentoReduzidoEventos.matches) {
            linhaTempo.classList.remove("linha-tempo-animada");
            linhaTempo.style.setProperty("--timeline-progress", "1");
            itensEventos.forEach(item => item.classList.add("visivel"));
            return;
        }
        const limites = linhaTempo.getBoundingClientRect();
        const linhaExibicao = window.innerHeight * 0.8;
        let progressoVisivel = Math.min(1, Math.max(0, (linhaExibicao - limites.top) / Math.max(limites.height, 1)));
        // Completa a linha se o fim da página impedir mais rolagem.
        if (Math.ceil(window.scrollY + window.innerHeight) >= raiz.scrollHeight - 2 && limites.bottom <= window.innerHeight) progressoVisivel = 1;
        linhaTempo.style.setProperty("--timeline-progress", String(progressoVisivel));
        linhaTempo.classList.add("linha-tempo-animada");
        itensEventos.forEach(item => {
            item.classList.toggle("visivel", item.getBoundingClientRect().top <= linhaExibicao);
        });
    }
    function agendarAtualizacaoLinhaTempo() {
        if (quadroEventos === null) quadroEventos = requestAnimationFrame(atualizarLinhaTempo);
    }
    window.addEventListener("scroll", agendarAtualizacaoLinhaTempo, { passive: true });
    window.addEventListener("resize", agendarAtualizacaoLinhaTempo);
    window.addEventListener("load", agendarAtualizacaoLinhaTempo);
    window.addEventListener("pageshow", agendarAtualizacaoLinhaTempo);
    movimentoReduzidoEventos.addEventListener("change", agendarAtualizacaoLinhaTempo);
    atualizarLinhaTempo();
}

// Cursor e luz de fundo: somente com mouse e sem preferência por movimento reduzido.
const cursorPersonalizado = document.querySelector(".cursor-personalizado");
const permiteCursor = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)");

if (cursorPersonalizado) {
    let posicaoMouse = null;
    let areaIluminada = null;
    let quadroCursor = null;

    function atualizarCursor() {
        quadroCursor = null;
        if (!posicaoMouse) return;

        const elemento = document.elementFromPoint(posicaoMouse.x, posicaoMouse.y);
        if (!elemento) {
            esconderCursor();
            return;
        }

        cursorPersonalizado.style.setProperty("--cursor-x", `${posicaoMouse.x}px`);
        cursorPersonalizado.style.setProperty("--cursor-y", `${posicaoMouse.y}px`);

        // Nos campos de texto, mantém o cursor de edição do navegador.
        const campoEdicao = elemento.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
        raiz.classList.toggle("cursor-ativo", !campoEdicao);

        const novaArea = elemento.closest(".conteudo-principal > section, .cabecalho, .rodape");
        if (areaIluminada !== novaArea) {
            if (areaIluminada) areaIluminada.classList.remove("fundo-iluminado");
            areaIluminada = novaArea;
        }

        if (areaIluminada) {
            const limitesArea = areaIluminada.getBoundingClientRect();
            areaIluminada.style.setProperty("--mouse-x", `${posicaoMouse.x - limitesArea.left}px`);
            areaIluminada.style.setProperty("--mouse-y", `${posicaoMouse.y - limitesArea.top}px`);
            areaIluminada.classList.add("fundo-iluminado");
        }
    }

    function agendarCursor() {
        if (posicaoMouse && quadroCursor === null) {
            quadroCursor = requestAnimationFrame(atualizarCursor);
        }
    }

    function acompanharMouse(evento) {
        if (!permiteCursor.matches || evento.pointerType !== "mouse") {
            esconderCursor();
            return;
        }

        posicaoMouse = { x: evento.clientX, y: evento.clientY };
        agendarCursor();
    }

    function esconderCursor() {
        raiz.classList.remove("cursor-ativo");
        if (areaIluminada) areaIluminada.classList.remove("fundo-iluminado");
        if (quadroCursor !== null) cancelAnimationFrame(quadroCursor);
        areaIluminada = null;
        posicaoMouse = null;
        quadroCursor = null;
    }

    document.addEventListener("pointermove", acompanharMouse, { passive: true });
    document.addEventListener("pointerdown", acompanharMouse, { passive: true });
    document.addEventListener("pointerout", evento => {
        if (!evento.relatedTarget) esconderCursor();
    });
    document.addEventListener("pointercancel", esconderCursor);
    document.addEventListener("keydown", evento => {
        if (evento.key === "Tab") esconderCursor();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) esconderCursor();
    });
    window.addEventListener("blur", esconderCursor);
    window.addEventListener("scroll", agendarCursor, { passive: true });
    window.addEventListener("resize", esconderCursor);
    permiteCursor.addEventListener("change", esconderCursor);
}

// A moldura fica parada; apenas a imagem se inclina levemente dentro dela.
const fotosComMovimento = document.querySelectorAll(".foto-com-movimento");
const permiteMovimentoFotos = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)");

fotosComMovimento.forEach(foto => {
    let posicaoSobreFoto = null;
    let quadroFoto = null;

    function inclinarFoto() {
        quadroFoto = null;
        if (!posicaoSobreFoto) return;

        const limitesFoto = foto.getBoundingClientRect();
        if (!limitesFoto.width || !limitesFoto.height) return;

        const horizontal = Math.max(-0.5, Math.min(0.5, (posicaoSobreFoto.x - limitesFoto.left) / limitesFoto.width - 0.5));
        const vertical = Math.max(-0.5, Math.min(0.5, (posicaoSobreFoto.y - limitesFoto.top) / limitesFoto.height - 0.5));

        // Limita a inclinação a dois graus para cada lado.
        foto.style.setProperty("--inclinacao-x", `${(-vertical * 4).toFixed(2)}deg`);
        foto.style.setProperty("--inclinacao-y", `${(horizontal * 4).toFixed(2)}deg`);
        foto.classList.add("foto-inclinada");
    }

    function acompanharMouseNaFoto(evento) {
        if (!permiteMovimentoFotos.matches || evento.pointerType !== "mouse") {
            restaurarFoto();
            return;
        }

        posicaoSobreFoto = { x: evento.clientX, y: evento.clientY };
        if (quadroFoto === null) quadroFoto = requestAnimationFrame(inclinarFoto);
    }

    function restaurarFoto() {
        if (quadroFoto !== null) cancelAnimationFrame(quadroFoto);
        quadroFoto = null;
        posicaoSobreFoto = null;
        foto.classList.remove("foto-inclinada");
        foto.style.removeProperty("--inclinacao-x");
        foto.style.removeProperty("--inclinacao-y");
    }

    foto.addEventListener("pointermove", acompanharMouseNaFoto, { passive: true });
    foto.addEventListener("pointerdown", acompanharMouseNaFoto, { passive: true });
    foto.addEventListener("pointerleave", restaurarFoto);
    foto.addEventListener("pointercancel", restaurarFoto);
    window.addEventListener("scroll", restaurarFoto, { passive: true });
    window.addEventListener("resize", restaurarFoto);
    window.addEventListener("blur", restaurarFoto);
    document.addEventListener("keydown", evento => {
        if (evento.key === "Tab") restaurarFoto();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) restaurarFoto();
    });
    permiteMovimentoFotos.addEventListener("change", restaurarFoto);
});

// Contato: só confirma o sucesso depois da resposta do Formspree.
const formularioContato = document.querySelector(".formulario-contato");

if (formularioContato) {
    const camposContato = [...formularioContato.querySelectorAll("[required]")];
    const botaoEnviar = formularioContato.querySelector(".enviar");
    const avisoContato = document.getElementById("contato-aviso");
    const notificacaoEnvio = document.querySelector(".notificacao-envio");
    const camadaConfetes = document.querySelector(".confetes");
    const reduzirConfetes = window.matchMedia("(prefers-reduced-motion: reduce)");
    let enviandoContato = false;
    let temporizadorConfetes;

    function mostrarAvisoContato(texto, erro = false) {
        avisoContato.textContent = texto;
        avisoContato.classList.toggle("aviso-erro", erro);
    }

    function validarContato(mostrarErros = false) {
        camposContato.forEach(campo => {
            let erro = "";
            if (!campo.value.trim()) erro = "Preencha este campo.";
            else if (campo.maxLength > 0 && campo.value.length > campo.maxLength) {
                erro = `Use no máximo ${campo.maxLength} caracteres.`;
            }
            campo.setCustomValidity(erro);
            if (mostrarErros || campo.getAttribute("aria-invalid") === "true") {
                campo.setAttribute("aria-invalid", String(!campo.validity.valid));
            }
        });

        const valido = camposContato.every(campo => campo.validity.valid);
        botaoEnviar.disabled = enviandoContato || !valido;
        return valido;
    }

    function limparConfetes() {
        clearTimeout(temporizadorConfetes);
        camadaConfetes.replaceChildren();
    }

    function soltarConfetes() {
        limparConfetes();
        if (reduzirConfetes.matches) return;

        const cores = ["#19c37d", "#38bdf8", "#facc15", "#e879f9"];
        const fragmento = document.createDocumentFragment();
        for (let indice = 0; indice < 42; indice++) {
            const confete = document.createElement("span");
            confete.className = "confete";
            confete.style.setProperty("--posicao-confete", `${Math.random() * 100}%`);
            confete.style.setProperty("--cor-confete", cores[indice % cores.length]);
            confete.style.setProperty("--desvio-confete", `${Math.random() * 160 - 80}px`);
            confete.style.setProperty("--duracao-confete", `${2.8 + Math.random() * 1.2}s`);
            confete.style.setProperty("--atraso-confete", `${Math.random() * 0.6}s`);
            fragmento.appendChild(confete);
        }
        camadaConfetes.appendChild(fragmento);
        temporizadorConfetes = setTimeout(limparConfetes, 5000);
    }

    camposContato.forEach(campo => {
        campo.addEventListener("input", () => {
            if (enviandoContato) return;
            mostrarAvisoContato(validarContato()
                ? "Tudo pronto. Clique em Enviar para mandar sua mensagem."
                : "Preencha todos os campos com um e-mail válido para liberar o envio.");
        });
        campo.addEventListener("change", () => validarContato());
        campo.addEventListener("blur", () => {
            if (!validarContato(true)) {
                mostrarAvisoContato("Confira os campos: todos são obrigatórios e o e-mail precisa ser válido.", true);
            }
        });
    });

    formularioContato.addEventListener("invalid", () => {
        mostrarAvisoContato("Preencha todos os campos corretamente antes de enviar.", true);
    }, true);

    formularioContato.addEventListener("submit", async evento => {
        evento.preventDefault();
        if (enviandoContato) return;
        if (!validarContato(true)) {
            mostrarAvisoContato("Preencha todos os campos corretamente antes de enviar.", true);
            formularioContato.reportValidity();
            return;
        }

        const dadosContato = new FormData(formularioContato);
        camposContato.forEach(campo => dadosContato.set(campo.name, campo.value.trim()));
        const controleEnvio = new AbortController();
        const limiteEspera = setTimeout(() => controleEnvio.abort(), 20000);
        enviandoContato = true;
        botaoEnviar.disabled = true;
        botaoEnviar.textContent = "Enviando…";
        formularioContato.setAttribute("aria-busy", "true");
        camposContato.forEach(campo => campo.readOnly = true);
        notificacaoEnvio.hidden = true;
        limparConfetes();
        mostrarAvisoContato("Enviando sua mensagem. Aguarde a confirmação.");

        try {
            const resposta = await fetch(formularioContato.action, {
                method: "POST",
                body: dadosContato,
                headers: { Accept: "application/json" },
                signal: controleEnvio.signal
            });
            const resultado = await resposta.json();

            if (!resposta.ok || resultado.ok !== true) {
                let mensagemErro = "Não foi possível enviar. Confira os dados e tente novamente mais tarde.";
                if (resposta.status === 429) {
                    mensagemErro = "O serviço recebeu muitos envios. Aguarde alguns minutos antes de tentar novamente.";
                } else if (JSON.stringify(resultado.errors || []).toLowerCase().includes("captcha")) {
                    mensagemErro = "A verificação antispam não foi concluída. Tente novamente mais tarde ou utilize o contato abaixo.";
                }
                mostrarAvisoContato(mensagemErro, true);
                return;
            }

            formularioContato.reset();
            camposContato.forEach(campo => campo.removeAttribute("aria-invalid"));
            mostrarAvisoContato("Para enviar outra mensagem, preencha os campos novamente.");
            notificacaoEnvio.hidden = false;
            notificacaoEnvio.querySelector(".titulo-notificacao").textContent = "Formulário enviado com sucesso!";
            soltarConfetes();
        } catch {
            mostrarAvisoContato("Não foi possível confirmar o envio. Seus dados foram mantidos. Confira sua conexão antes de tentar novamente.", true);
        } finally {
            clearTimeout(limiteEspera);
            enviandoContato = false;
            formularioContato.removeAttribute("aria-busy");
            camposContato.forEach(campo => campo.readOnly = false);
            botaoEnviar.textContent = "Enviar";
            validarContato();
        }
    });

    notificacaoEnvio.querySelector(".fechar-notificacao").addEventListener("click", () => {
        notificacaoEnvio.hidden = true;
        camposContato[0].focus();
    });
    reduzirConfetes.addEventListener("change", limparConfetes);
    window.addEventListener("pagehide", limparConfetes);
    window.addEventListener("pageshow", () => validarContato());
    validarContato();
}
