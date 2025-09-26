# INSTRUÇÕES PARA DEPLOY NA HOSTINGER - TOLONI PESCARIAS

## ⚠️ IMPORTANTE: LEIA TUDO ANTES DE COMEÇAR

### 1. PREPARAÇÃO DO AMBIENTE

**A. Editar Credenciais do Banco de Dados:**
Abrir arquivo `config/database_hostinger.php` e alterar:
```php
define('DB_NAME', 'SEU_BANCO_REAL');     // Ex: u123456789_toloni
define('DB_USER', 'SEU_USUARIO_REAL');   // Ex: u123456789_user  
define('DB_PASS', 'SUA_SENHA_REAL');     // Sua senha do MySQL
```

**B. Importar Banco de Dados:**
1. Ir no painel da Hostinger → MySQL
2. Abrir phpMyAdmin
3. Criar banco de dados (se não existir)
4. Importar arquivo: `database/hostinger_final.sql`

### 2. BUILD E DEPLOY

**A. Gerar Build de Produção:**
```bash
npm run build
```

**B. Estrutura Final na Hostinger (public_html/):**
```
public_html/
├── index.html          ← do build (dist/index.html)
├── assets/             ← do build (dist/assets/)
├── api/                ← toda pasta api/
├── config/             ← toda pasta config/
├── .htaccess           ← arquivo raiz
└── uploads/            ← criar pasta (permissão 755)
```

**C. Passos de Upload:**
1. Upload conteúdo da pasta `dist/` para `public_html/`
2. Upload pasta `api/` para `public_html/api/`
3. Upload pasta `config/` para `public_html/config/`
4. Upload arquivo `.htaccess` para `public_html/`
5. Criar pasta `uploads/` em `public_html/` (755)

### 3. CONFIGURAÇÕES NA HOSTINGER

**A. Permissões de Pastas:**
- `public_html/uploads/` → 755 (leitura/escrita)
- `public_html/api/` → 755
- `public_html/config/` → 755

**B. SSL/HTTPS:**
- Certificar que SSL está ativo no domínio
- Forçar redirecionamento HTTPS (já está no .htaccess)

### 4. TESTE APÓS DEPLOY

**A. Testar APIs:**
1. Acessar: `https://seudominio.com.br/api/auth/check-session.php`
2. Deve retornar: `{"success":true,"data":{"authenticated":false}}`

**B. Testar Frontend:**
1. Acessar: `https://seudominio.com.br`
2. Tentar fazer login
3. Verificar se carrega corretamente

### 5. RESOLUÇÃO DE PROBLEMAS

**CORS Error:**
- Verificar se SSL está ativo
- Confirmar se domínio está correto no config

**Database Connection Error:**
- Verificar credenciais em `config/database_hostinger.php`
- Confirmar se banco foi importado corretamente

**404 nas APIs:**
- Verificar se pasta `api/` foi enviada
- Confirmar se .htaccess está no local correto

**Cookies não funcionam:**
- Certificar que está acessando via HTTPS
- Verificar se domínio está correto

### 6. ESTRUTURA DE PRODUÇÃO FINAL

```
https://tolonipescarias.com.br/           ← Frontend React
https://tolonipescarias.com.br/api/       ← APIs PHP
https://tolonipescarias.com.br/uploads/   ← Imagens uploads
```

### ✅ CHECKLIST FINAL

- [ ] Credenciais do banco atualizadas
- [ ] Banco de dados importado
- [ ] Build gerado (`npm run build`)
- [ ] Arquivos enviados para public_html/
- [ ] Pasta uploads/ criada com permissão 755
- [ ] SSL ativo no domínio
- [ ] Teste de API funcionando
- [ ] Frontend carregando corretamente
- [ ] Login/logout funcionando

### 🚀 RESULTADO ESPERADO

Após seguir todos os passos:
- ✅ Site carrega normalmente
- ✅ APIs respondem corretamente  
- ✅ Autenticação funciona
- ✅ Upload de imagens funciona
- ✅ Todas funcionalidades operacionais