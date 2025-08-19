# 🚀 GUIA COMPLETO - MIGRAÇÃO PARA HOSTINGER

## 📋 PRÉ-REQUISITOS

✅ **Conta Hostinger ativa**  
✅ **Domínio configurado**: tolonipescarias.com.br  
✅ **SSL ativo** (obrigatório para cookies seguros)  
✅ **PHP 8.0+** e **MySQL 8.0+**

---

## 🔧 PASSO 1: PREPARAR ARQUIVOS LOCALMENTE

### 1.1 Build do Frontend React
```bash
npm run build
```

### 1.2 Estrutura de arquivos para upload
```
public_html/
├── index.html (da pasta dist/)
├── assets/ (da pasta dist/assets/)
├── api/
│   ├── auth/
│   ├── middleware/
│   └── *.php
├── config/
│   ├── database.php
│   ├── admin_config.php
│   ├── session_cookies.php
│   └── production_config.php
├── auth/
├── includes/
├── database/
└── deploy_final.php
```

---

## 🗄️ PASSO 2: CONFIGURAR BANCO DE DADOS

### 2.1 Criar banco na Hostinger
1. Acesse **cPanel → MySQL Databases**
2. Crie banco: `u123456789_toloni`
3. Crie usuário: `u123456789_user`
4. Defina senha segura
5. Associe usuário ao banco com **ALL PRIVILEGES**

### 2.2 Atualizar configurações
Edite `config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_toloni'); // SEU BANCO REAL
define('DB_USER', 'u123456789_user');   // SEU USUÁRIO REAL
define('DB_PASS', 'SuaSenhaSegura123'); // SUA SENHA REAL
```

### 2.3 Importar schema
1. Acesse **phpMyAdmin**
2. Selecione seu banco
3. Vá em **Importar**
4. Faça upload de `database/schema.sql`
5. Faça upload de `database/trophies_schema.sql`

---

## 📁 PASSO 3: FAZER UPLOAD DOS ARQUIVOS

### 3.1 Via File Manager (cPanel)
1. Acesse **cPanel → File Manager**
2. Navegue até `public_html/`
3. Faça upload dos arquivos da estrutura acima
4. Extraia se necessário

### 3.2 Via FTP
```bash
# Conectar via FTP
ftp ftp.tolonipescarias.com.br
# Fazer upload da pasta completa
```

### 3.3 Definir permissões corretas
```bash
# Arquivos: 644
find public_html/ -type f -exec chmod 644 {} \;

# Diretórios: 755
find public_html/ -type d -exec chmod 755 {} \;

# Criar diretório de logs
mkdir public_html/logs
chmod 755 public_html/logs
```

---

## 🔐 PASSO 4: CONFIGURAR SEGURANÇA

### 4.1 Gerar chaves de segurança
Edite `config/production_config.php`:
```php
define('JWT_SECRET_KEY', 'nova-chave-jwt-super-secreta-' . date('YmdHis'));
define('ENCRYPTION_KEY', 'nova-chave-criptografia-' . date('YmdHis'));
define('SECURITY_SALT', 'novo-salt-seguranca-' . date('YmdHis'));
```

### 4.2 Configurar SSL e HTTPS
- Verificar se SSL está ativo no painel Hostinger
- Forçar redirecionamento HTTPS no `.htaccess`

---

## 📧 PASSO 5: CONFIGURAR EMAIL

### 5.1 Criar conta de email
1. **cPanel → Email Accounts**
2. Criar: `noreply@tolonipescarias.com.br`
3. Definir senha segura

### 5.2 Configurar SMTP
Edite `config/production_config.php`:
```php
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'noreply@tolonipescarias.com.br');
define('SMTP_PASSWORD', 'SuaSenhaEmail123');
```

---

## ✅ PASSO 6: VERIFICAÇÃO FINAL

### 6.1 Executar script de verificação
Acesse: `https://tolonipescarias.com.br/deploy_final.php`

Este script verificará:
- ✅ Conexão com banco
- ✅ Extensões PHP
- ✅ Permissões de arquivos
- ✅ Usuário admin
- ✅ Configurações de segurança

### 6.2 Testes manuais
1. **Homepage**: https://tolonipescarias.com.br
2. **Login admin**: 
   - Email: `toloni.focos@gmail.com`
   - Senha: `admin123` (alterar após primeiro login)
3. **API de sessão**: https://tolonipescarias.com.br/api/auth/check-session.php

### 6.3 Verificar logs
```bash
tail -f public_html/logs/security.log
```

---

## 🚨 TROUBLESHOOTING

### Erro 500 - Internal Server Error
- Verificar permissões de arquivos (644/755)
- Verificar logs de erro do servidor
- Verificar sintaxe PHP

### Erro de conexão com banco
- Verificar credenciais em `config/database.php`
- Verificar se banco foi criado
- Verificar se usuário tem privilégios

### Cookies não funcionam
- Verificar se SSL está ativo
- Verificar domínio nos cookies
- Verificar configurações de segurança

### Login não funciona
- Executar `deploy_final.php` para diagnóstico
- Verificar se usuário admin existe
- Verificar logs de segurança

---

## 🔄 PASSO 7: PÓS-MIGRAÇÃO

### 7.1 Segurança
- [ ] Alterar senha do admin
- [ ] Remover `deploy_final.php` após testes
- [ ] Configurar backup automático
- [ ] Monitorar logs regularmente

### 7.2 Otimização
- [ ] Configurar cache
- [ ] Otimizar banco de dados
- [ ] Configurar CDN (se necessário)

### 7.3 Monitoramento
- [ ] Configurar alertas de erro
- [ ] Monitorar performance
- [ ] Verificar backups regulares

---

## 📞 SUPORTE

**Em caso de problemas:**
1. Verificar logs: `public_html/logs/security.log`
2. Executar: `deploy_final.php`
3. Verificar configurações do servidor
4. Contatar suporte Hostinger se necessário

---

## ✨ SISTEMA PRONTO!

Após seguir todos os passos, seu sistema estará funcionando em:
🌐 **https://tolonipescarias.com.br**

**Credenciais do admin:**
- **Email**: toloni.focos@gmail.com
- **Senha**: admin123 (alterar no primeiro login)

**Funcionalidades ativas:**
- ✅ Sistema de autenticação seguro
- ✅ Painel administrativo
- ✅ Gestão de usuários
- ✅ Sistema de relatórios
- ✅ Galeria de troféus
- ✅ Logs de segurança
- ✅ Cookies seguros com HTTPS