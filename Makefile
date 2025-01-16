FG_BLACK		:= \033[90m
FG_RED			:= \033[91m
FG_GREEN		:= \033[92m
FG_YELLOW		:= \033[93m
FG_BLUE			:= \033[94m
FG_MAGENTA		:= \033[95m
FG_CYAN			:= \033[96m
FG_WHITE		:= \033[97m
FG_DEFAULT		:= \033[39m

DEFAULT			:= \033[0m
BOLD			:= \033[1m
ITALIC			:= \033[3m
UNDERLINE		:= \033[4m
REVERSE			:= \033[7m
STRIKETHROUGH	:= \033[9m

BG_BLACK		:= \033[100m
BG_RED			:= \033[101m
BG_GREEN		:= \033[102m
BG_YELLOW		:= \033[103m
BG_BLUE			:= \033[104m
BG_MAGENTA		:= \033[105m
BG_CYAN			:= \033[106m
BG_WHITE		:= \033[107m
BG_DEFAULT		:= \033[49m

RESET 			:= \033[0m

all:
	@sh nginx/make_config
	@cp .env.production ./frontend/.env
	@cp .env.production ./backend/.env
	@cp .env.production .env
	@$(MAKE) up

up:
	@docker compose -p transcendence -f docker-compose.yml up --build -d
	@echo "🛜  $(FG_GREEN)Connect to $(FG_WHITE)$(UNDERLINE)https://localhost$(RESET) 🛜"

down:
	@docker compose -p transcendence -f docker-compose.yml down
	@echo "🚫 $(FG_RED)Disconnected$(RESET) 🚫"

stop:
	@docker compose -p transcendence -f docker-compose.yml stop
	@echo "🛑 $(FG_YELLOW)Stopped$(RESET) 🛑"

start:
	@echo "$(FG_GREEN)Started$(RESET)"
	@docker compose -p transcendence -f docker-compose.yml start
	@echo "$(FG_GREEN)Connect to $(FG_WHITE)$(UNDERLINE)https://localhost$(RESET)"

re:
	@echo "$(FG_GREEN)Restarted$(RESET)"
	@$(MAKE) clean
	@$(MAKE) all

log:
	@echo "📄 $(FG_CYAN)Logs$(RESET) 📄"
	@docker compose -p transcendence -f docker-compose.yml logs -f

clean:
	@$(MAKE) down
	@docker system prune -af --volumes
	@echo "🧹 $(FG_BLUE)Cleaned up$(RESET) 🧹"

populatedb:
	@docker exec -it backend python manage.py populatedb

.PHONY: all build up down stop start re log clean populatedb

