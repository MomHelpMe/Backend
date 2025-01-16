## Django REST Framework CSRF 공격 및 방어 방법 추가

제공해주신 CSRF 공격 예제와 방어 방법에 대한 이해도가 높으시네요. Django REST Framework 환경을 고려하여 공격 방법과 방어 방법을 더 자세히 설명하고 추가적인 내용을 덧붙이겠습니다.

**더 다양한 Django REST Framework CSRF 공격 예시**

1. **AJAX 요청을 이용한 CSRF 공격:**

   최근 웹 애플리케이션은 AJAX를 통해 서버와 비동기적으로 데이터를 주고받는 경우가 많습니다. 공격자는 JavaScript 코드를 이용하여 악의적인 AJAX 요청을 보내 CSRF 공격을 시도할 수 있습니다.

   - **공격 시나리오:** 사용자가 악성 웹사이트를 방문하면, 해당 웹사이트의 JavaScript 코드가 사용자의 인증된 상태를 이용하여 Django REST Framework API 엔드포인트로 민감한 작업을 수행하는 AJAX 요청을 보냅니다.

   - **재현 방법:**

     ```html
     <!DOCTYPE html>
     <html>
       <head>
         <title>CSRF 공격 예제 (AJAX)</title>
       </head>
       <body>
         <h1>악의적인 페이지</h1>
         <button id="attackButton">계정 삭제 시도</button>

         <script>
           document
             .getElementById("attackButton")
             .addEventListener("click", function () {
               var xhr = new XMLHttpRequest();
               xhr.open(
                 "POST",
                 "https://localhost:443/api/users/delete/",
                 true
               );
               xhr.withCredentials = true; // 쿠키를 함께 보내도록 설정
               xhr.setRequestHeader("Content-Type", "application/json");
               xhr.send(JSON.stringify({ user_id: 145128 }));
             });
         </script>
       </body>
     </html>
     ```

   - **설명:** `xhr.withCredentials = true;` 설정을 통해 브라우저는 대상 도메인(`https://localhost:443`)의 쿠키를 요청과 함께 자동으로 전송합니다. 사용자가 해당 사이트에 로그인되어 있다면, 서버는 공격자의 요청을 정당한 사용자의 요청으로 오인할 수 있습니다.

2. **파일 업로드 기능을 이용한 CSRF 공격:**

   파일 업로드 기능은 CSRF 공격에 취약할 수 있습니다. 공격자는 악성 파일을 업로드하는 요청을 위조하여 서버에 피해를 줄 수 있습니다.

   - **공격 시나리오:** 사용자가 악성 웹사이트를 방문하면, 해당 웹사이트의 form이 자동으로 제출되어 파일 업로드 API 엔드포인트로 악성 파일 업로드 요청을 보냅니다.

   - **재현 방법:**

     ```html
     <!DOCTYPE html>
     <html>
       <head>
         <title>CSRF 공격 예제 (파일 업로드)</title>
       </head>
       <body>
         <h1>악의적인 페이지</h1>
         <form
           action="https://localhost:443/api/upload/"
           method="post"
           enctype="multipart/form-data"
         >
           <input type="file" name="file" />
           <button type="submit">악성 파일 업로드</button>
         </form>
         <script>
           // 페이지 로드 시 자동으로 폼 제출
           document.querySelector("form").submit();
         </script>
       </body>
     </html>
     ```

3. **로그아웃 CSRF (Logout CSRF):**

   로그아웃 기능에 CSRF 방어 대책이 없다면, 공격자는 사용자를 의도치 않게 로그아웃시킬 수 있습니다. 이는 서비스 거부 공격의 한 형태가 될 수 있습니다.

   - **공격 시나리오:** 공격자는 사용자가 방문하도록 유도하는 악성 링크를 생성합니다. 해당 링크는 사용자의 인증된 세션으로 로그아웃 요청을 보냅니다.

   - **재현 방법:**

     ```html
     <a href="https://localhost:443/api/logout/">강제로 로그아웃 당하기</a>
     <img
       src="https://localhost:443/api/logout/"
       width="0"
       height="0"
       style="visibility:hidden;"
     />
     ```

   - **설명:** 사용자가 링크를 클릭하거나, 이미지가 로드되면서 로그아웃 API 엔드포인트로 GET 요청이 전송됩니다.

**Django REST Framework CSRF 방어 방법 심화**

제공해주신 기본적인 방어 방법 외에 Django REST Framework 환경에서 CSRF 공격을 효과적으로 방어하기 위한 심화된 방법들을 소개합니다.

1. **CSRF Token 사용 및 검증 (가장 중요):**

   Django는 CSRF 공격 방어를 위한 강력한 메커니즘을 기본적으로 제공합니다. 이를 올바르게 적용하는 것이 핵심입니다.

   - **템플릿에서 CSRF Token 사용:** Django 템플릿에서 POST, PUT, DELETE 등 데이터 변경 요청을 보내는 form에는 반드시 `{% csrf_token %}` 템플릿 태그를 포함시켜야 합니다. 이 태그는 Django가 생성한 고유한 CSRF 토큰을 hidden input 필드 형태로 삽입합니다.

     ```html
     <form method="post" action="/api/me/">
       {% csrf_token %}
       <button type="submit">정보 수정</button>
     </form>
     ```

   - **AJAX 요청 시 CSRF Token 전송:** JavaScript를 이용하여 AJAX 요청을 보내는 경우에는 HTTP 헤더 또는 쿠키를 통해 CSRF 토큰을 서버에 전달해야 합니다.

     - **HTTP 헤더를 통한 전송:** Django는 `X-CSRFToken`이라는 이름의 HTTP 헤더를 통해 CSRF 토큰을 받도록 설계되어 있습니다. Django 템플릿에서 CSRF 토큰을 가져와서 AJAX 요청의 헤더에 포함시킬 수 있습니다.

       ```javascript
       function getCookie(name) {
         let cookieValue = null;
         if (document.cookie && document.cookie !== "") {
           const cookies = document.cookie.split(";");
           for (let i = 0; i < cookies.length; i++) {
             const cookie = cookies[i].trim();
             // Does this cookie string begin with the name we want?
             if (cookie.substring(0, name.length + 1) === name + "=") {
               cookieValue = decodeURIComponent(
                 cookie.substring(name.length + 1)
               );
               break;
             }
           }
         }
         return cookieValue;
       }

       const csrftoken = getCookie("csrftoken");

       document
         .getElementById("attackButton")
         .addEventListener("click", function () {
           var xhr = new XMLHttpRequest();
           xhr.open("POST", "https://localhost:443/api/users/delete/", true);
           xhr.setRequestHeader("Content-Type", "application/json");
           xhr.setRequestHeader("X-CSRFToken", csrftoken); // CSRF 토큰 헤더에 추가
           xhr.send(JSON.stringify({ user_id: 145128 }));
         });
       ```

     - **JavaScript Cookie에서 직접 가져오기:** Django는 CSRF 토큰을 `csrftoken`이라는 이름의 쿠키에 저장합니다. JavaScript에서 이 쿠키 값을 읽어와서 사용할 수 있습니다.

   - **Django REST Framework에서 CSRF 검증:** Django의 CSRF 미들웨어(`django.middleware.csrf.CsrfViewMiddleware`)는 요청에 포함된 CSRF 토큰을 검증합니다. Django REST Framework를 사용하는 경우에도 이 미들웨어가 활성화되어 있는지 확인해야 합니다.

   - **`@csrf_protect` 데코레이터:** 특정 뷰 함수에 대해 명시적으로 CSRF 보호를 활성화하려면 `@csrf_protect` 데코레이터를 사용할 수 있습니다.

     ```python
     from django.views.decorators.csrf import csrf_protect
     from rest_framework.decorators import api_view
     from rest_framework.response import Response

     @api_view(['POST'])
     @csrf_protect
     def my_view(request):
         # ...
         return Response({'message': '성공'})
     ```

   - **`CSRF_COOKIE_HTTPONLY` 및 `CSRF_COOKIE_SECURE` 설정:**
     - `CSRF_COOKIE_HTTPONLY = True`: JavaScript에서 CSRF 쿠키에 접근하는 것을 방지하여 XSS 공격으로 인한 CSRF 토큰 탈취를 어렵게 합니다. (기본값: `False`)
     - `CSRF_COOKIE_SECURE = True`: HTTPS 연결에서만 CSRF 쿠키를 전송하도록 설정하여 중간자 공격을 통한 토큰 탈취를 방지합니다. (개발 환경에서는 `False`로 설정할 수 있습니다.)

2. **`SameSite` 쿠키 속성 설정:**

   `SameSite` 속성은 브라우저가 크로스-사이트 요청과 함께 쿠키를 보내는 방식을 제어하여 CSRF 공격을 완화하는 데 도움을 줍니다.

   - **`SameSite=Lax`:** 기본값입니다. 특정 안전한 HTTP 메서드(GET, HEAD, OPTIONS, TRACE) 요청이나, 사용자가 링크를 클릭하거나 주소창에 직접 입력하는 등의 Top-Level Navigation의 경우 쿠키를 보냅니다. POST 요청 등에는 쿠키를 보내지 않아 대부분의 CSRF 공격을 방어할 수 있습니다.

   - **`SameSite=Strict`:** 가장 엄격한 설정입니다. 모든 크로스-사이트 요청에 대해 쿠키를 보내지 않습니다. CSRF 공격 방어에는 효과적이지만, 일부 정상적인 사용 사례(예: 외부 사이트에서 링크를 통해 진입)에서 문제가 발생할 수 있습니다.

   - **`SameSite=None; Secure`:** 크로스-사이트 요청에서도 쿠키를 보내도록 허용합니다. 하지만 보안을 위해 `Secure` 속성과 함께 사용하여 HTTPS 환경에서만 쿠키가 전송되도록 해야 합니다. 이 설정은 서드파티 쿠키를 사용하는 경우에 필요할 수 있지만, CSRF 공격에 취약해질 수 있으므로 신중하게 사용해야 합니다.

   - **Django 설정:** `SESSION_COOKIE_SAMESITE` 및 `CSRF_COOKIE_SAMESITE` 설정을 통해 `SameSite` 속성을 설정할 수 있습니다.

     ```python
     SESSION_COOKIE_SAMESITE = 'Lax'
     CSRF_COOKIE_SAMESITE = 'Lax'
     ```

3. **Origin 헤더 검증:**

   서버에서 요청의 `Origin` 헤더 값을 확인하여 신뢰할 수 있는 도메인에서 온 요청인지 검증하는 방법입니다. `Origin` 헤더는 브라우저가 자동으로 설정하며, JavaScript로 조작할 수 없습니다.

   - **미들웨어 구현 예시:**

     ```python
     class OriginCheckMiddleware:
         def __init__(self, get_response):
             self.get_response = get_response
             self.ALLOWED_ORIGINS = ['https://yourdomain.com', 'https://anotherdomain.com']

         def __call__(self, request):
             origin = request.META.get('HTTP_ORIGIN')
             if request.method == 'POST' and origin not in self.ALLOWED_ORIGINS:
                 return HttpResponseForbidden("CSRF check failed: Origin not allowed.")
             response = self.get_response(request)
             return response
     ```

   - **주의:** `Origin` 헤더는 모든 브라우저에서 항상 전송되는 것은 아니며, 특히 특정 리다이렉션 상황에서는 누락될 수 있습니다. 따라서 CSRF 토큰 검증과 함께 사용하는 것이 좋습니다.

4. **Referer 헤더 검증 (보조적인 방법):**

   요청의 `Referer` 헤더 값을 확인하여 요청이 예상되는 페이지에서 발생했는지 확인하는 방법입니다. 하지만 `Referer` 헤더는 클라이언트 측에서 위조하거나 브라우저 설정에 따라 생략될 수 있으므로, 주요 방어 수단보다는 보조적인 수단으로 활용해야 합니다.

5. **Double Submit Cookie 방식:**

   CSRF 토큰을 쿠키와 요청 파라미터(또는 헤더) 두 곳에 모두 실어 보내고, 서버에서 두 토큰 값을 비교하여 유효성을 검증하는 방식입니다. Django의 CSRF 보호 메커니즘과 유사하지만, Django의 내장 기능을 사용하는 것이 더 편리하고 안전합니다.

6. **CSRF 방어 예외 처리:**

   특정 뷰에 대해서 CSRF 방어를 비활성화해야 하는 경우가 있을 수 있습니다 (예: 외부 API와의 연동). 이 경우 `@csrf_exempt` 데코레이터를 사용하여 특정 뷰에 대한 CSRF 검증을 건너뛸 수 있습니다. 하지만 보안 취약점을 만들 수 있으므로, 정말 필요한 경우에만 신중하게 사용해야 합니다.

   ```python
   from django.views.decorators.csrf import csrf_exempt
   from rest_framework.decorators import api_view
   from rest_framework.response import Response

   @api_view(['POST'])
   @csrf_exempt
   def external_api_callback(request):
       # ...
       return Response({'message': '콜백 성공'})
   ```

7. **로그아웃 CSRF 방어:**

   로그아웃 기능은 데이터를 변경하는 요청이 아니므로 CSRF 방어에 소홀하기 쉽습니다. 하지만 공격자가 사용자를 강제로 로그아웃시키는 것을 방지하기 위해 POST 요청 방식으로 변경하고 CSRF 토큰 검증을 적용하는 것이 좋습니다. Django는 기본적으로 POST 요청 방식으로 로그아웃을 처리하며 CSRF 토큰 검증을 수행합니다.

**결론**

Django REST Framework 환경에서 CSRF 공격을 방어하는 가장 효과적인 방법은 Django가 제공하는 CSRF 보호 메커니즘을 올바르게 사용하는 것입니다. 템플릿 태그, AJAX 요청 시 헤더 설정, 미들웨어 활성화 등을 통해 CSRF 토큰을 안전하게 관리하고 검증해야 합니다. `SameSite` 쿠키 속성 설정과 `Origin` 헤더 검증은 추가적인 보안 계층을 제공할 수 있습니다. 항상 최신 보안 권장 사항을 따르고, 정기적인 보안 점검을 통해 웹 애플리케이션의 취약점을 관리하는 것이 중요합니다. 특히, JWT와 같은 별도의 인증 방식을 사용하는 경우에도 Django의 CSRF 보호 기능을 함께 적용하여 보안성을 높이는 것을 권장합니다.
