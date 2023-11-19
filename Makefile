# **************************************************************************** #
#                                   MAKEFILE                                   #
# **************************************************************************** #

########################### Vars ###########################

export GID = $(shell id -g)
NAME = ft_trasncendence

########################## Colors ##########################

CUT = \033[K
R = \033[31;1m
G = \033[32;1m
Y = \033[33;1m
B = \033[34;1m
P = \033[35;1m
GR = \033[30;1m
LB = \033[36m
LG = \033[0;90m
END = \033[0m

########################## Rules ##########################


all: clean build composeup ## Builds and starts FT_TRASCENDENCE.

build: ## Builds images before starting containers.
	@echo "\n$(GR)[$(B)'$(NAME)': $(GR)Building Docker-Compose. Please wait...          ]${END}"
	@docker-compose build
	@echo "\n$(G)[$(B)'$(NAME)': $(G)Building finished successfully                     ]${END}\n"

fbuild: ## Builds images before starting containers. NO-CACHE option.
	@echo "\n$(GR)[$(B)'$(NAME)': $(GR)Building Docker-Compose. Please wait...          ]${END}"
	@docker-compose build --no-cache
	@echo "\n$(G)[$(B)'$(NAME)': $(G)Building finished successfully                     ]${END}\n"

composeup: ## Starts and runs containers in the background, print new container names.
	@echo "\n$(GR)[$(B)'$(NAME)': $(GR)Starting Containers in background. Please wait...]${END}"
	@docker-compose up -d tx_front tx_nest tx_postgres tx_nginx
	@echo "\n$(G)[$(B)'$(NAME)': $(G)All containers started and running. Enjoy          ]${END}\n"

up: ## Removes unused containers and starts and runs containers in the background.
	@echo "\n$(GR)[$(B)'$(NAME)': $(GR)Removing unused containers. Please wait...]${END}"
	@docker rmi $(shell docker images -f "dangling=true" -qa)
	@echo "\n$(GR)[$(B)'$(NAME)': $(GR)Starting Containers in background. Please wait...]${END}"
	@docker-compose up -d
	@echo "\n$(G)[$(B)'$(NAME)': $(G)All containers started and running. Enjoy          ]${END}\n"

down: ## Stops containers and removes containers, networks, volumes and images.
	@echo "\n$(R)[$(B)'$(NAME)': $(R)Stopping and removing containers. Please wait...   ]${END}"
	@docker-compose down
	@echo "\n$(R)[$(B)'$(NAME)': $(R)All containers removed                             ]${END}\n"

logs: ## Shows containers' logs in follow mode.
	@echo "\n$(GR)[                     $(B)'$(NAME)'$(GR)LOGS - with historial         ]${END}"
	@docker-compose logs -f

attach:
	@echo "\n$(GR)[                     $(B)'$(NAME)'$(GR)LOGS - without historial      ]${END}"
	@bash -c "./scripts/docker-attach.sh" &

clean: ## Stop containers. Remove containers. Remove data folders. Remove all unused images.
	@echo "\n$(GR)[Cleaning $(B)'$(NAME)'$(GR). Please wait...                          ]${END}"
	@docker-compose down -v --rmi all
	@docker volume prune -f
	@echo "$(G)[Removed $(B) $(NAME) $(G)successfully                                   ]$(END)\n"

fclean:	clean ## Cleans and removes development folders and files.
	@echo "\n$(GR)[Cleaning $(B)'Develop Folders'$(GR). Please wait...                  ]${END}"
	@rm -rf database/data/*
	@rm -rf frontend/srcs/node_modules
	@rm -rf frontend/srcs/.angular
	@rm -rf frontend/srcs/package-lock.json
	@rm -rf srcs/node_modules
	@rm -rf srcs/package-lock.json
	@echo "$(G)[Removed $(B) Folders $(G)successfully                                   ]$(END)\n"

prune: ## Clean up unused Docker resources.
	@echo "\n$(GR)[Cleaning $(B)'$(NAME)'$(GR) unused resources. Please wait...         ]${END}"
	@docker system prune -af
	@echo "$(G)[Cleaning $(B) $(NAME) $(G)completed                                     ]$(END)\n"

space: ## Display disk usage of Docker resources.
	@echo "\n$(GR)[                   $(B)'$(NAME)'$(GR)RESOURCES                       ]${END}"
	@docker system df

re: fclean build composeup ## Remove all and rebuild.

front: ## Builds and runs frontend container in the background.
	@echo "\n$(GR)[$(B)'$(NAME)': $(GR)Building Frontend Docker-Compose. Please wait... ]${END}"
	@docker-compose build --no-cache tx_front
	@echo "\n$(GR)[$(B)'$(NAME)': $(GR)Starting Frontend in background. Please wait...  ]${END}"
	@docker-compose up -d tx_front
	@echo "\n$(G)[$(B)'$(NAME)': $(G)All containers started and running. Enjoy          ]${END}\n"

ls: ## Shows images and ALL Containers.
	@echo "\n$(GR)[                    $(B)'$(NAME)'$(GR)IMAGES                         ]${END}"
	@docker images
	@echo "\n$(GR)[                  $(B)'$(NAME)'$(GR)CONTAINERS                       ]${END}"
	@docker ps -a

ps: ## Shows Containers.
	@echo "\n$(GR)[                  $(B)'$(NAME)'$(GR)CONTAINERS                       ]${END}"
	@docker ps

debug: fclean build ## Starts FT_TRASCENDENCE in debug mode.
	@echo "\n$(GR)[$(B)'$(NAME)': $(GR)Starting all services including tx_adminer in debug mode. Please wait...]${END}"
	@docker-compose up -d
	@echo "\n$(G)[$(B)'$(NAME)': $(G)All services started and running. Debug mode.       ]${END}\n"

reset: down fclean clean prune ## [Develop] Use this when experiencing CORS or login problems.

help: ## Shows help and Usage
	@echo "\n$(LB)_______________________________ $(NAME) _______________________________$(END)"
	@echo "\n\tUsage: 'make $(LB)<command>$(END)'\n"
	@grep -E '^[a-z.A-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "${LB}%-20s${END} %s\n", $$1, $$2}'
	@echo "\n\t$(LG)Using [Argument] $(LB)'V=1'$(LG) will show all the building output$(END)"
	@echo "\n$(LB)_______________________________________________________________________$(END)\n\n"

.PHONY:		all build up down logs clean fclean re space mariadb wordpress nginx

$(V).SILENT:
