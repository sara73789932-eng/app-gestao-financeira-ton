# Tom Financeiro

App de gestão financeira para pequenos empreendedores que usam maquininha de cartão — separa dinheiro pessoal do empresarial, calcula taxas automaticamente e dá clareza total do fluxo de caixa.

Acesso 100% fechado: ninguém se cadastra sozinho, só o admin libera.

## 1. Criar o projeto no Firebase

1. Acesse https://console.firebase.google.com e crie um projeto.
2. Em **Build > Authentication > Sign-in method**, ative **E-mail/senha**.
3. Em **Build > Firestore Database**, crie o banco (modo produção).
4. Em **Configurações do projeto > Seus apps**, crie um app Web e copie as credenciais.
5. Cole as credenciais em `src/firebase.js` (substitua os campos `SUA_API_KEY`, etc).
6. Publique as regras de segurança: copie o conteúdo de `firestore.rules` para a aba **Regras** do Firestore (ou use `firebase deploy --only firestore:rules` com a Firebase CLI).

## 2. Criar o primeiro usuário ADMIN (manual, uma única vez)

O painel admin só existe depois que já existe um admin — então o primeiro precisa ser criado à mão:

1. Em **Authentication > Users**, clique em "Add user", informe e-mail e senha.
2. Copie o **UID** gerado.
3. Em **Firestore Database**, crie a coleção `usuarios` com um documento cujo ID é esse UID, com os campos:
   ```
   nome: "Seu Nome"
   email: "seu@email.com"
   role: "admin"
   status: "ativo"
   deviceId: null
   ```
4. Pronto — faça login no app com esse e-mail/senha e você cai no Painel Admin, de onde pode criar os demais usuários.

> Nota de produção: o Painel Admin usa uma instância secundária do SDK do Firebase no navegador para criar novos logins sem derrubar a sessão do admin. Isso funciona bem para uso interno, mas para um produto com muitos administradores o ideal é migrar a criação de usuários para uma **Cloud Function** com o Admin SDK, chamada via `httpsCallable`.

## 3. Rodar localmente

```bash
npm install
npm run dev
```

## 4. Deploy (Vercel ou Netlify)

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm run build
# depois arraste a pasta dist/ para app.netlify.com/drop
# ou: npm install -g netlify-cli && netlify deploy --prod
```

Build command: `npm run build` · Output directory: `dist`

## Estrutura de dados (Firestore)

```
usuarios/{uid}
  nome, email, role ('admin' | 'user'), status ('ativo' | 'bloqueado'), deviceId, ultimoAcesso

usuarios/{uid}/entradas/{id}
  valorBruto, taxaPercentual, valorLiquido, origem, data, dividido

usuarios/{uid}/gastos/{id}
  grupo ('pessoal' | 'empresarial'), categoria, valor, data, origemEntradaId
```

## Segurança de dispositivo

No primeiro login, o app grava um ID único do navegador em `usuarios/{uid}.deviceId`. Logins seguintes só são aceitos nesse mesmo dispositivo — para trocar de aparelho, o admin precisa clicar em "Liberar novo dispositivo" no painel.

## Sobre a marca "Tom"

Este projeto usa uma paleta de cores inspirada na identidade visual azul/verde/branco e o texto de exemplo menciona "Maquininha Tom" e "clientes da Maquininha Tom" conforme solicitado no briefing. Se este produto não for oficialmente afiliado à Stone/Tom, recomenda-se ajustar essa copy antes de publicar, para não sugerir parceria ou endosso que não existe.
