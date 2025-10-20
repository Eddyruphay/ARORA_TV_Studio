
import streamlit as st

def main():
    st.set_page_config(layout="wide", page_title="ARORA TV - Mesa de Curadoria")

    st.title("📺 ARORA TV - Mesa de Curadoria")
    st.write("O painel de controle para a IA-Gerente e IA-Maestro.")

    st.header("🕵️‍♂️ Garimpeiro Digital")
    
    search_topic = st.text_input(
        "Pesquisar Tema para Curadoria (Ex: 'Filmes de Ficção Científica no Telegram')",
        placeholder="Digite um tema, nome de filme, ou link do Telegram..."
    )

    if st.button("Pesquisar"):
        if search_topic:
            st.info(f"Analisando a tarefa: '{search_topic}'...")
            
            constitution_path = "/data/data/com.termux/files/home/ARORA_TV_Studio/gemini.md"
            
            try:
                with open(constitution_path, "r", encoding="utf-8") as f:
                    constitution = f.read()
                
                st.subheader("🧠 Processo de Pensamento da IA")
                st.write("A IA está a usar a seguinte Constituição e tarefa para formular um plano:")

                prompt_to_llm = f"""
# CONSTITUIÇÃO (REGRAS E IDENTIDADE)
{constitution}

# TAREFA DO UTILIZADOR
A tarefa atual é: "{search_topic}"

# PLANO DE AÇÃO
Com base na Constituição e na Tarefa do Utilizador, qual é o plano de ação detalhado? Quais ferramentas devo usar e em que ordem?
"""
                
                st.text_area("Prompt a ser enviado para o Cérebro (LLM):", prompt_to_llm, height=400)

                # O próximo passo será enviar este prompt para a API do Gemini
                # e interpretar a resposta para executar as ferramentas.

            except FileNotFoundError:
                st.error(f"Erro Crítico: A Constituição ('{constitution_path}') não foi encontrada.")
            except Exception as e:
                st.error(f"Ocorreu um erro ao ler a constituição: {e}")

        else:
            st.error("Por favor, insira um tema para pesquisar.")

    st.sidebar.header("Sobre")
    st.sidebar.info(
        "Esta é a interface de controle para a IA da ARORA TV. "
        "Use o painel principal para curar, criar e verificar conteúdo."
    )

if __name__ == "__main__":
    main()
