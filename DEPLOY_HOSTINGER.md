# Deploy na Hostinger - Instruções

## Preparação do Projeto

1. **Build do projeto React:**
   ```bash
   npm run build
   ```

2. **Estrutura de arquivos para upload:**
   ```
   public_html/
   ├── index.html (do build)
   ├── assets/ (do build)
   ├── api/
   │   ├── auth/
   │   │   ├── login.php
   │   │   ├── register.php
   │   │   ├── resend-verification.php
   │   │   └── verify-email.php
   │   ├── schedules.php
   │   ├── trophies.php
   │   └── outros arquivos PHP...
   ├── config/
   │   ├── database.php
   │   ├── security.php
   │   ├── session.php
   │   └── admin_config.php
   ├── includes/
   ├── database/
   └── .htaccess
   ```

## Configuração do Banco de Dados

1. **Criar banco MySQL na Hostinger**
2. **Atualizar config/database.php:**
   ```php
   $host = 'localhost'; // ou IP do servidor MySQL da Hostinger
   $dbname = 'seu_banco_de_dados';
   $username = 'seu_usuario';
   $password = 'sua_senha';
   ```

3. **Importar schema do banco:**
   - Execute `database/schema.sql` no phpMyAdmin da Hostinger
   - Execute `database/trophies_schema.sql` se necessário

## Upload dos Arquivos

1. **Via cPanel File Manager ou FTP:**
   - Upload todos os arquivos do `dist/` (build) para `public_html/`
   - Upload todos os arquivos PHP para `public_html/`
   - Manter a estrutura de pastas

2. **Verificar permissões:**
   - Arquivos PHP: 644
   - Pastas: 755

## Configurações Finais

1. **IMPORTANTE: HTTPS obrigatório**
   - Configure SSL na Hostinger (essencial para cookies seguros)
   - Cookies `secure: true` só funcionam com HTTPS

2. **Testar endpoints:**
   - `seudominio.com/api/auth/login.php`
   - `seudominio.com/api/auth/register.php`
   - `seudominio.com/api/auth/check-session.php`
   - `seudominio.com/api/auth/logout.php`

3. **Verificar logs de erro:**
   - Usar cPanel Error Logs para debug

4. **Configurar cabeçalhos de segurança:**
   - Verificar se .htaccess foi carregado corretamente

## URLs de Teste

Após o deploy, teste:
- Frontend: `https://seudominio.com`
- Login: `https://seudominio.com/login`
- API Login: `https://seudominio.com/api/auth/login.php`
- Verificar Session: `https://seudominio.com/api/auth/check-session.php`

## Sistema de Autenticação com Cookies

O sistema agora usa **cookies seguros** em vez de localStorage:

### Fluxo de Login:
1. User faz login → cookie `session_token` é criado automaticamente
2. Cookie válido por 7 dias
3. Cookie renovado automaticamente a cada requisição
4. Verificação automática de sessão no frontend

### Configurações de Segurança:
- `httponly: true` - Cookie inacessível via JavaScript
- `secure: true` - Só funciona com HTTPS
- `samesite: 'Lax'` - Proteção CSRF
- Token único por sessão no banco

## Sistema de Consentimento LGPD

O sistema inclui banner de consentimento de cookies conforme LGPD:

### Funcionalidades:
- Banner aparece na primeira visita
- Persistência por 30 dias via cookie `cookie_consent`
- Gerenciamento de categorias de cookies (essenciais, analytics, marketing)
- Integração com backend para aplicar políticas

### Cookies Utilizados:
- `session_token` - Autenticação (essencial)
- `cookie_consent` - Consentimento do usuário
- Analytics/Marketing - Apenas se consentido

### Backend Integration:
- Arquivo `config/cookie_consent.php` para verificar consentimento
- Logs de consentimento na tabela `security_logs`
- Headers apropriados baseados no consentimento

## Troubleshooting

- **Erro 500:** Verificar logs de erro do PHP
- **JSON inválido:** Verificar se não há saída antes dos headers
- **Rotas não funcionam:** Verificar se .htaccess foi carregado
- **CORS:** Já configurado nos arquivos PHP
- **Banner não aparece:** Verificar se cookie `cookie_consent` não existe

## Checklist Final

- [ ] Build do React concluído
- [ ] Arquivos PHP atualizados com sistema de cookies
- [ ] Banco de dados configurado com tabela `user_sessions`
- [ ] .htaccess no lugar certo
- [ ] **SSL ATIVO (obrigatório para cookies seguros)**
- [ ] Teste de login funcionando com cookies
- [ ] Teste de logout limpando cookies
- [ ] Verificação automática de sessão funcionando
- [ ] Renovação automática de sessão funcionando
- [ ] Banner de consentimento LGPD funcionando
- [ ] Política de privacidade atualizada e acessível